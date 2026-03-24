/**
 * 食谱页面模块
 */
export default function initRecipes() {
    const recipesContainer = document.querySelector('.recipes-container');
    if (!recipesContainer) return;

    // 从 data 属性读取数据
    let recipesData = [];
    const dataAttr = recipesContainer.getAttribute('data-recipes');
    
    if (dataAttr && dataAttr !== 'null' && dataAttr !== 'undefined') {
        try {
            // 解码 HTML 实体
            const decodedData = dataAttr.replace(/&#39;/g, "'");
            recipesData = JSON.parse(decodedData);
            console.log('[Recipes] 从 data 属性加载数据成功，共', recipesData.length, '道食谱');
        } catch (e) {
            console.error('[Recipes] 解析数据失败:', e);
        }
    }
    
    if (!recipesData || recipesData.length === 0) {
        console.warn('[Recipes] 没有找到食谱数据');
        const grid = document.getElementById('recipesGrid');
        if (grid) {
            grid.innerHTML = `<div class="empty-state">📂 暂无食谱数据<br><span style="font-size: 13px;">请在 source/_data/recipes.json 中添加食谱后重新生成</span></div>`;
        }
        return;
    }

    init(recipesData);
}

function init(recipesData) {
    console.log('[Recipes] 初始化食谱页面，共', recipesData.length, '道食谱');

    let currentKeyword = "";
    let currentPage = 1;
    let itemsPerPage = 9;

    // 统一暖色调配色
    const colorThemes = [
        { gradient: 'linear-gradient(135deg, #E67E22, #F39C12)' },
        { gradient: 'linear-gradient(135deg, #16A085, #1ABC9C)' },
        { gradient: 'linear-gradient(135deg, #9B59B6, #8E44AD)' },
        { gradient: 'linear-gradient(135deg, #E74C3C, #EC7063)' },
        { gradient: 'linear-gradient(135deg, #3498DB, #5DADE2)' },
        { gradient: 'linear-gradient(135deg, #F1C40F, #F4D03F)' },
        { gradient: 'linear-gradient(135deg, #2ECC71, #58D68D)' },
        { gradient: 'linear-gradient(135deg, #E67E22, #F5B041)' },
        { gradient: 'linear-gradient(135deg, #1ABC9C, #48C9B0)' },
        { gradient: 'linear-gradient(135deg, #F06292, #F8BBD0)' },
        { gradient: 'linear-gradient(135deg, #5C6BC0, #7986CB)' },
        { gradient: 'linear-gradient(135deg, #FFB74D, #FFA726)' }
    ];

    function getColorTheme(index) {
        return colorThemes[index % colorThemes.length];
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function getFilteredRecipes() {
        if (!currentKeyword) return recipesData;
        const lowerKeyword = currentKeyword.toLowerCase().trim();
        return recipesData.filter(r => {
            const searchText = [
                r.name,
                r.brief,
                ...(r.vegetables || []),
                ...(Array.isArray(r.ingredients) ? r.ingredients : [])
            ].filter(Boolean).join(" ").toLowerCase();
            return searchText.includes(lowerKeyword);
        });
    }

    function render() {
        const grid = document.getElementById('recipesGrid');
        const stats = document.getElementById('searchStats');
        const pagination = document.getElementById('pagination');
        if (!grid) return;

        const filtered = getFilteredRecipes();
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (currentPage > totalPages) currentPage = totalPages || 1;
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filtered.slice(start, end);

        if (stats) {
            if (currentKeyword) {
                stats.innerHTML = `找到 ${totalItems} 道符合“${escapeHtml(currentKeyword)}”的食谱`;
            } else {
                stats.innerHTML = `共 ${totalItems} 道食谱 · 试试搜索菜名或食材`;
            }
        }

        if (pageItems.length === 0) {
            grid.innerHTML = `<div class="empty-state">🍽️ 没有找到包含“${escapeHtml(currentKeyword)}”的食谱</div>`;
            if (pagination) pagination.innerHTML = '';
            return;
        }

        grid.innerHTML = pageItems.map((r, idx) => {
            const theme = getColorTheme(start + idx);
            return `
                <div class="recipe-card" style="background: ${theme.gradient}; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                    <div class="recipe-header">
                        <div class="recipe-name">${escapeHtml(r.name)}</div>
                        <div class="veg-tags">${(r.vegetables || []).map(v => `<span class="veg-tag">${escapeHtml(v)}</span>`).join('')}</div>
                    </div>
                    <div class="recipe-brief">📖 ${escapeHtml(r.brief)}</div>
                    <div class="recipe-content">
                        <div class="recipe-section">
                            <div class="recipe-section-title">🥕 食材清单</div>
                            <div class="recipe-ingredients">${(Array.isArray(r.ingredients) ? r.ingredients : []).map(i => `• ${escapeHtml(i)}`).join('<br>')}</div>
                        </div>
                        <div class="recipe-section">
                            <div class="recipe-section-title">📝 烹饪步骤</div>
                            <div class="recipe-steps">${(Array.isArray(r.steps) ? r.steps : []).map((s, i) => `${i+1}. ${escapeHtml(s)}`).join('<br>')}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (totalPages > 1 && pagination) {
            let paginationHtml = '<div class="pagination-container">';
            paginationHtml += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹ 上一页</button>`;
            
            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            if (startPage > 1) {
                paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
                if (startPage > 2) paginationHtml += `<span class="page-ellipsis">...</span>`;
            }
            
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) paginationHtml += `<span class="page-ellipsis">...</span>`;
                paginationHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
            }
            
            paginationHtml += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>下一页 ›</button>`;
            paginationHtml += '</div>';
            pagination.innerHTML = paginationHtml;
            
            document.querySelectorAll('.pagination-container .page-btn:not(.disabled)').forEach(btn => {
                btn.removeEventListener('click', handlePageClick);
                btn.addEventListener('click', handlePageClick);
            });
        } else if (pagination) {
            pagination.innerHTML = '';
        }
    }

    function handlePageClick(e) {
        const page = parseInt(e.target.dataset.page);
        if (page && page !== currentPage) {
            currentPage = page;
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function updateSearch(keyword) {
        currentKeyword = keyword || '';
        currentPage = 1;
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('clearBtn');
        if (input) input.value = currentKeyword;
        if (clearBtn) clearBtn.style.display = currentKeyword ? 'block' : 'none';
        render();
    }

    function clearSearch() {
        updateSearch('');
        document.getElementById('searchInput')?.focus();
    }

    // 绑定事件 - 确保使用最新元素
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');

    if (searchInput) {
        // 移除旧监听器
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        newInput.addEventListener('input', (e) => updateSearch(e.target.value));
    }

    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.addEventListener('click', clearSearch);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentKeyword) clearSearch();
    });

    // 响应窗口大小变化
    function updateItemsPerPage() {
        const width = window.innerWidth;
        if (width >= 1920) itemsPerPage = 12;
        else if (width >= 1200) itemsPerPage = 9;
        else if (width >= 768) itemsPerPage = 6;
        else itemsPerPage = 4;
        currentPage = 1;
        render();
    }
    
    updateItemsPerPage();
    window.addEventListener('resize', () => updateItemsPerPage());
    
    render();
}