
(function(factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(require('i-love-ajax'), require('jquery'));
    } else {
        window.ilx = factory(ilx, jQuery);
    }
})(function(ilx, $) {

    var defaultOptions = {
        selectors: {
            items: 'tbody > tr',
            itemsContainer: 'tbody',
            pagination: '.ilx-filter-pagination',
            inputTerms: '[name="ilx_filter[terms]"]',
            inputSortFieldNames: '[name="ilx_filter[sort_field_names]"]',
            inputSortOrder: '[name="ilx_filter[sort_order]"]',
            inputItemsPerPage: '[name="ilx_filter[items_per_page]"]',
            inputPage: '[name="ilx_filter[page]"]',
            inputPageSelect: '.ilx-filter-page-select',
            inputData: '[name^="ilx_filter["][name$="]"]',
            labelNumberOfItems: '.ilx-filter-number-of-items'
        },
        classes: {
            item: '',
            itemPlaceholder: 'ilx-filter-placeholder',
            itemPlaceholderSpinner: 'ilx-filter-loading-spinner',
            buttonPage: 'ilx-filter-page',
            buttonPageDefault: '',
            buttonPageActive: 'ilx-filter-active',
            buttonPageDisabled: 'ilx-filter-disabled',
            buttonPagePrev: 'ilx-filter-prev',
            buttonPageNext: 'ilx-filter-next'
        },
        html: {
            itemPlaceholder: ['tr', 'td', 'span'],
            colspan: 1000
        },
        json: {
            itemsCount: 'itemsCount',
            totalCount: 'totalCount'
        }
    };

    ilx.Filter = function($container, options) {
        $container = $($container);
        if ($container.length !== 0) {
            this.init($container, options);
        }
    };

    ilx.Filter.prototype.init = function($container, options) {
        $container = $($container);
        this.$container = $container;
        this.options = {};

        $.extend(true, this.options, defaultOptions);

        this.setOptions(options);

        _init(this.$container, this.options);
    };

    ilx.Filter.prototype.setOptions = function(options) {
        $.extend(true, this.options, options);
    };

    ilx.Filter.prototype.setOption = function(name, value) {
        if (typeof value === 'object' && name in this.options && typeof this.options[name] === 'object') {
            $.extend(true, this.options[name], value);
        } else {
            this.options[name] = value;
        }
    };

    ilx.Filter.prototype.getOption = function(name) {
        return this.options[name];
    };

    ilx.Filter.prototype.refresh = function() {
        _fetchItems(this.$container, this.options);
        _fetchStats(this.$container, this.options);
    };

    ilx.Filter.prototype.refreshItems = function() {
        _fetchItems(this.$container, this.options);
    };

    ilx.Filter.prototype.refreshStats = function() {
        _fetchStats(this.$container, this.options);
    };

    var _class2selector = function(className) {
        return '.' + className.replace(/\s+/g, '.');
    };

    var _selector2class = function(selector) {
        return selector.replace(/\./g, ' ').trim();
    };

    var _init = function($container, options) {
        $container.find(options.selectors.inputTerms).off('change').on('change', function() {
            $container.find(options.selectors.inputPage).val(1);

            _fetchItems($container, options);
            _fetchStats($container, options);
        });

        $container.find(options.selectors.inputSortFieldNames+', '+options.selectors.inputSortOrder).off('change').on('change', function() {
            _fetchItems($container, options);
        });

        $container.find(options.selectors.inputItemsPerPage).off('change').on('change', function() {
            _fetchItems($container, options);
            _fetchStats($container, options);
        });

        $container.find(options.selectors.inputPage).off('change').on('change', function() {
            _fetchItems($container, options);
            _fetchStats($container, options);
        });

        $container.find(options.selectors.inputPageSelect).off('change').on('change', function() {
            $container.find(options.selectors.inputPage).val($(this).val()).change();
        });

        var pageSelectors = _class2selector(options.classes.buttonPage)+'[data-ilx-filter-page]' + ', ' + _class2selector(options.classes.buttonPagePrev)+'[data-ilx-filter-page]' + ', ' + _class2selector(options.classes.buttonPageNext)+'[data-ilx-filter-page]';
        $container.off('click', pageSelectors).on('click', pageSelectors, function() {
            $container.find(options.selectors.inputPage).val($(this).attr('data-ilx-filter-page')).change();
        });

        _fetchItems($container, options);
        _fetchStats($container, options);
    };

    var _fetchItems = function($container, options) {
        $container.trigger($.Event('ilx-filter.fetch-items.before', {}));

        var url = $container.attr('data-ilx-filter-items-url');
        if (typeof url === 'undefined' || url.length === 0) {
            return;
        }
        var method = $container.attr('data-ilx-filter-fetch-method') || 'post';
        var data = $container.find(options.selectors.inputData).serialize();

        if ($.isArray(options.html.itemPlaceholder) || typeof options.html.itemPlaceholder === 'string') {
            var tagNames = $.isArray(options.html.itemPlaceholder) ? options.html.itemPlaceholder : [options.html.itemPlaceholder];
            var $placeholder = $('<'+tagNames[0]+'/>', { 'class': options.classes.item+' '+options.classes.itemPlaceholder });
            var $spinner = $placeholder;
            for (var i = 1; i < tagNames.length; ++i) {
                var $e = $('<'+tagNames[i]+'/>');
                if (tagNames[i] === 'td' || tagNames[i] === 'th') {
                    $e.attr('colspan', options.html.colspan);
                }
                $spinner.append($e);
                $spinner = $e;
            }
            $spinner.addClass(options.classes.itemPlaceholderSpinner);
            $container.find(options.selectors.items).remove();
            $container.find(options.selectors.itemsContainer).append($placeholder);
        }

        var settings = {
            url: url,
            data: data,
            method: method,
            complete: function(jqXHR, textStatus) {
                var $response = $(jqXHR.responseText);
                var $items = ilx.filterContent($response);
                $container.find(options.selectors.items).remove();
                $container.find(options.selectors.itemsContainer).append($items);

                $container.trigger($.Event('ilx-filter.fetch-items.after', {}));
            }
        };
        $.ajax(settings);
    };

    var _fetchStats = function($container, options) {
        $container.trigger($.Event('ilx-filter.fetch-stats.before', {}));

        var url = $container.attr('data-ilx-filter-stats-url');
        if (typeof url === 'undefined' || url.length === 0) {
            return;
        }
        var method = $container.attr('data-ilx-filter-fetch-method') || 'post';
        var data = $container.find(options.selectors.inputData).serialize();

        var settings = {
            url: url,
            data: data,
            method: method,
            complete: function(jqXHR, textStatus) {
                var json = JSON.parse(jqXHR.responseText);
                _updateNumberOfItems($container, options, json[options.json.itemsCount], json[options.json.totalCount]);
                _updatePagination($container, options, json[options.json.itemsCount]);

                $container.trigger($.Event('ilx-filter.fetch-stats.after', {}));
            }
        };
        $.ajax(settings);
    };

    var _updateNumberOfItems = function($container, options, itemsCount, totalCount) {
        var itemsPerPage = 1*$container.find(options.selectors.inputItemsPerPage).val();
        var page = 1*$container.find(options.selectors.inputPage).val();

        var start = (page - 1) * itemsPerPage + 1;
        var end = start + itemsPerPage - 1;
        if (end > itemsCount) {
            end = itemsCount;
        }
        if (start > end) {
            start = end;
        }

        var $label = $container.find(options.selectors.labelNumberOfItems);
        var text;// = undefined;

        if (itemsCount === totalCount) {
            text = $label.attr('data-ilx-filter-number-of-items');
        } else if (start <= itemsCount) {
            text = $label.attr('data-ilx-filter-number-of-filtered-items');
        } else {
            text = $label.attr('data-ilx-filter-number-of-zero-items');
        }

        if (text === undefined) {
            text = itemsCount+' / '+totalCount;
        }

        text = text.replace(':start', start).replace(':end', end).replace(':items_count', itemsCount).replace(':total_count', totalCount);
        $label.html(text);
    };

    var _updatePagination = function($container, options, itemsCount) {
        var itemsPerPage = 1*$container.find(options.selectors.inputItemsPerPage).val();
        var page = 1*$container.find(options.selectors.inputPage).val();
        if (isNaN(itemsPerPage) || itemsPerPage < 1) {
            itemsPerPage = 100;
        }
        if (isNaN(page) || page < 1) {
            page = 1;
        }

        var pageCount = Math.floor((1*itemsCount + itemsPerPage - 1) / itemsPerPage);

        var $pagination = $container.find(options.selectors.pagination);
        $pagination.find(_class2selector(options.classes.buttonPage)+'[data-ilx-filter-page!="1"]').remove();
        var $page_1 = $pagination.find(_class2selector(options.classes.buttonPage)+'[data-ilx-filter-page="1"]');
        $page_1.removeClass(options.classes.buttonPageActive+' '+options.classes.buttonPageDefault).addClass(options.classes[1 === page ? 'buttonPageActive' : 'buttonPageDefault']);

        var add_page = function(p) {
            var $page_p = $('<button/>', { 'class': options.classes.buttonPage, 'data-ilx-filter-page': p }).text(p);
            $page_p.addClass(options.classes[p === page ? 'buttonPageActive' : 'buttonPageDefault']);
            $page_p.insertAfter($page_1);
            return $page_p;
        };
        var add_ellipsis = function() {
            var $ellipsis = $('<button/>', { 'class': options.classes.buttonPage }).html('&#x22EF;');
            $ellipsis.addClass(options.classes.buttonPageDisabled).prop('disabled', true);
            $ellipsis.insertAfter($page_1);
            return $ellipsis;
        };

        if (pageCount > 1) {
            add_page(pageCount);
        }
        if (pageCount > page + 2+1) {
            add_ellipsis();
        }
        for (var p = page + 2; p >= page - 2; --p) {
            if (p > 1 && p < pageCount) {
                add_page(p);
            }
        }
        if (1 < page - 2-1) {
            add_ellipsis();
        }

        $pagination.find(_class2selector(options.classes.buttonPagePrev)).removeClass(options.classes.buttonPageDefault+' '+options.classes.buttonPageDisabled).addClass(options.classes[page > 1 ? 'buttonPageDefault' : 'buttonPageDisabled']).prop('disabled', page <= 1).attr('data-ilx-filter-page', page > 1 ? page - 1 : null);
        $pagination.find(_class2selector(options.classes.buttonPageNext)).removeClass(options.classes.buttonPageDefault+' '+options.classes.buttonPageDisabled).addClass(options.classes[page < pageCount ? 'buttonPageDefault' : 'buttonPageDisabled']).prop('disabled', page >= pageCount).attr('data-ilx-filter-page', page < pageCount ? page + 1 : null);

        var $select = $container.find(options.selectors.inputPageSelect);
        $select.find('option').remove();
        for (/*var */p = 1; p <= pageCount; ++p) {
            $select.append($('<option/>', { 'value': p }).text(p));
        }
        $select.val(page);
    };

    return ilx;
});
