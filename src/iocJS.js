(function (root, factory) {
    root.iocJS = factory(root, {});
})(this, function (root, exports) {
    'use strict';

    var fnArgsExp = /function[^(]*?\(\s*[^)]+\s*\)/i;
    var fnSingleLineCommentExp = /\/\/.*?\n/g;
    var fnMoreLineCommentExp = /\/\*(.|\s)*?\*\//g;
    var isAbsoluteUrlExp = /(http:\/\/|file:\/\/\/\w+:)/i;
    var fileExp = /([^/.]+)(\.js)?(\?.*?)?$/i;

    var slice = Array.prototype.slice;

    var extend = function (target) {
        var args = target ? slice.call(arguments, 1) : slice.call(arguments), value;
        target || (target = this);

        args.forEach(function (object) {
            Object.keys(object).forEach(function (key) {
                (value = (object[key])) != void 0 && (target[key] = value);
            });
        });

        return target;
    };

    // 通用功能
    var basicFeature = extend({}, {
        getBaseUrl: function () {
            var script = document.currentScript;
            var baseUrl = script.getAttribute('data-baseurl');
            var pageUrl = root.location.href;

            return this.mergeDir(baseUrl, pageUrl);
        },

        mergeDir: function (dir, url) {
            var isAbsoluteUrl = isAbsoluteUrlExp.test(url);
            var isRootDir = dir.charAt(0) === '/';
            var protocol = '', domain = '', dirs, urls;

            if (isAbsoluteUrl) {
                protocol = RegExp.$1;
                url = url.slice(protocol.length);

                if (protocol.indexOf('http') >= 0) {
                    domain = url.slice(0, url.lastIndexOf() + 1);
                }

                url = isRootDir ? '' : url.slice(domain.length);
            }

            dirs = dir.split('/');
            dirs.pop();

            urls = url.split('/');
            urls.pop();

            isRootDir && dirs.shift();

            dirs.forEach(function (directory) {
                if (directory === '..') {
                    urls.pop();
                } else if (directory !== '.') {
                    urls.push(directory);
                }
            });

            return protocol + domain + this.supplementUrl(urls.join('/'));
        },

        supplementUrl: function (url) {
            return url.slice(-1) === '/' ? url : url + '/';
        },

        getFullUrl: function (dir, url) {
            var isAbsoluteUrl = isAbsoluteUrlExp.test(dir), baseUrl, filename, suffix, extra;

            if (isAbsoluteUrl) {
                url = dir;
                dir = '';
            }

            baseUrl = this.mergeDir(dir, url);
            filename = fileExp.test(dir || url) && RegExp.$1;
            suffix = RegExp.$2 || '.js';
            extra = RegExp.$3 || '';

            return baseUrl + filename + suffix + extra;
        },

        getClassInstance: function (fn) {
            var fnString = fn.toString(), fnArgsString, fnPropsString;



        }
    });

    /*
    * 函数对象解析类
    * */
    function ResolveClass () {
        this.cacheClass = {};
        this.id = '';
        this.props = [];
    }

    extend(ResolveClass, {
        getClassInstance: function (fn) {
            var fnString = fn.toString();
            var fnArgsString = this._getArgsString(fnString);
            var fnPropsString = this._getPropsString(fnString);

        },

        _getArgsString: function (fnString) {
            return fnArgsExp.test(fnString) ? RegExp.$1 : '';
        },

        _getPropsString: function (fnString) {

        },

        _executeClassString: function () {

        }

    });

    /*
    * 模块类
    * */
    function Module () {

    }

    extend(Module, {
        state: {
            init: 0,
            loaded: 1,
            interactive: 2,
            complete: 3
        }
    })

    Module.prototype.initialize = function () {

    };

    /*
    * 异步加载器类
    * */
    function AsyncLoader () {

    }

    extend(AsyncLoader.prototype, {
        load: function () {},

        _createScript: function () {

        },

        _complete: function () {

        }
    });

    /*
    *
    * */
    exports.initialize = function () {

    };

    /**
     * 生成模块导出对象
     *
     * @param {Function} fn 类
     * @param {Object} exports 导出对象
     */
    exports.buildModuleExports = function (fn, exports) {
        var instance = basicFeature.getClassInstance(fn);
    };

    /*
    *
    * */
    exports.use = function () {

    }
});
