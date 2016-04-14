/**
 * javascript 依赖注入
 *
 * @author zengwenbin
 * @email zwenbin@163.com
 * @date 2016-4-14
 * @version 1.0.0
 */

;(function (root, factory) {
    root.iocJS = factory(root, {});
})(this, function (root, exports) {
    var fnArgsExp = /function[^(]*?\(\s*[^)]+\s*\)/i;
    var fnSingleLineCommentExp = /\/\/.*?\n/g;
    var fnMoreLineCommentExp = /\/\*(.|\s)*?\*\//g;
    var fnPropsExp = /this(\.\$?|\[\s*\$?(\'|\")[\w-]*?(\'|\")\s*\])\w*\s*=(.|\s)*?;/g;
    var isAbsoluteUrlExp = /(http:\/\/|file:\/\/\/\w+:)/i;
    var fileExp = /([^/.]+)(\.js)?(\?.*?)?$/i;
    var trimExp = /\s+/g;
    var slice = Array.prototype.slice;
    var EOL = '\r\n';

    var headElement = document.head || document.documentElement.head;

    // 通用功能
    var basicFeature = {
        extend: function (target) {
            var args = target ? slice.call(arguments, 1) : slice.call(arguments), value;
            target || (target = this);

            args.forEach(function (object) {
                Object.keys(object).forEach(function (key) {
                    (value = (object[key])) != void 0 && (target[key] = value);
                });
            });

            return target;
        },

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

        trim: function (str) {
            return str.replace(trimExp, '');
        }
    };

    // 解析函数对象
    var resolveFnToClass = basicFeature.extend({}, {
        getClassInstance: function (fn) {
            var fnString = this.clearComment(fn.toString());
            var fnArgsArray = this.getArgsArray(fnString);
            var fnOwnPropsArray = this.getOwnPropsArray(fnString);
            var fnProtoPropsArray = this.getProtoPropsArray(fn);
            var classString = this.getClassString(fnArgsArray, fnOwnPropsArray, fnProtoPropsArray);

            return this.executeClassString(classString);
        },

        getArgsArray: function (fnString) {
            return fnArgsExp.test(fnString) ? basicFeature.trim(RegExp.$1).split(',') : [];
        },

        getOwnPropsArray: function (fnString) {
            return fnString.match(fnPropsExp) || [];
        },

        getProtoPropsArray: function (fn) {
            var proto = fn.prototype;
            var result = [], key;

            for (key in proto) {
                result.push({
                    name: key,
                    value: proto[key]
                });
            }

            return result;
        },

        clearComment: function (fnString) {
            return fnString
                .replace(fnSingleLineCommentExp, '')
                .replace(fnMoreLineCommentExp, '');
        },

        getClassString: function (fnArgsArray, fnOwnPropsArray, fnProtoPropsArray) {
            var fnString = 'function Glass('+ fnArgsArray.join(',') +'{' + EOL;

            fnOwnPropsArray.forEach(function (ownProp) {
                fnString += ownProp + EOL;
            });
            fnString += '}' + EOL;

            fnProtoPropsArray && (fnString += 'Glass.prototype.');

            fnProtoPropsArray.forEach(function (protoProp) {
                fnString += protoProp.name + '=' + protoProp.value.toString() + ';' + EOL;
            });

            return fnString;
        },

        executeClassString: function (classString) {
            try {
                eval(classString);

                return new Glass();
            } catch (e) {
                console.log('解析字符串函数出错，信息：' + e.stack);

                return {};
            }
        }
    });

    /**
     * 模块类
     * @constructor
     *
     * @param {String} id 模块标识
     */
    function Module (id) {
        this.id = id;
        new AsyncLoader(this.id, this.complete);
    }

    basicFeature.extend(Module, {
        cacheModules: {}
    });

    basicFeature.extend(Module.prototype, {
        clone: function () {
            return new this.constructor
        },

        complete: function () {
            var module = Module.cacheModules[this.id];
            var deps = typeof module.$deps === 'string' ? [module.$deps] : module.$deps;

            if (!deps.length) module.status = 4;

            deps.forEach(function (dep) {
                new AsyncLoader
            });
        },

        beginExec: function () {

        }
    });

    /**
     * 异步加载器类
     * @constructor
     *
     * @param {String} id 模块标识(模块相对路径，名称必须和文件名保持一致)
     * @param {Function} completeCallback 加载完成回调函数
     */
    function AsyncLoader (id, completeCallback) {
        this.id = id;
        this.completeCallback = completeCallback;

        this.load();
    }

    basicFeature.extend(AsyncLoader.prototype, {
        load: function () {
            var baseUrl = basicFeature.getBaseUrl();
            var id = this.id;
            var path = basicFeature.getFullUrl(id, baseUrl);

            this._createScript(path);
        },

        _createScript: function (path) {
            var self = this;
            var script = document.createElement('script');

            script.charset = 'utf-8';
            script.async = true;
            script.src = path;

            script.onerror = function () {
                script.onerror = null;
                headElement.removeChild(script);
                self._outputError('加载模块失败，路径：' + path);
            };

            script.onload = function () {
                script.onload = null;
                headElement.removeChild(script);

                self.completeCallback();
            };

            headElement.insertBefore(script, headElement.firstChild);
        },

        _outputError: function (msg) {
            throw new Error(msg);
        }
    });

    /**
     * 生成模块导出对象
     *
     * @param {Function} fn 类
     */
    exports.buildModuleExports = function (fn) {
        var instance = resolveFnToClass.getClassInstance(fn);
        Module.cacheModules[instance.$id] = instance;
    };

    /**
     * 使用模块
     *
     * @param {String} id 模块标识
     * @return {Module}
     */
    exports.use = function (id) {
        return Module.cacheModules[id] || new Module(id);
    };
});
