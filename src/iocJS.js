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
    var fnArgsExp = /function[^(]*?\((\s*[^)]+\s*)?\)/i;
    var fnSingleLineCommentExp = /\/\/.*?\n/g;
    var fnMoreLineCommentExp = /\/\*(.|\s)*?\*\//g;
    var fnPropsExp = /this(\.\$?|\[\s*\$?(\'|\")[\w-]*?(\'|\")\s*\])\w*\s*=(.|\s)*?;/g;
    var isAbsoluteUrlExp = /(http:\/\/|file:\/\/\/\w+:)/i;
    var fileExp = /([^/.]+)(\.js)?(\?.*?)?$/i;
    var trimExp = /\s+/g;
    var slice = Array.prototype.slice;
    var toString = Object.prototype.toString;
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
            var baseUrl = script.getAttribute('data-baseurl') || './';
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
            return fnArgsExp.test(fnString) ? basicFeature.trim(RegExp.$1 || '').split(',') : [];
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
            var fnString = 'function Glass('+ fnArgsArray.join(',') +'){' + EOL;

            fnOwnPropsArray.forEach(function (ownProp) {
                fnString += ownProp + EOL;
            });
            fnString += '}' + EOL;

            fnProtoPropsArray.forEach(function (protoProp) {
                fnString += 'Glass.prototype.' + protoProp.name + '=' + protoProp.value.toString() + ';' + EOL;
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
     * @param {String} parentId 父模块标识
     */
    function Module (id, parentId) {
        this.id = id;
        this.parentId = parentId;

        new AsyncLoader(id, this.complete());
    }

    basicFeature.extend(Module, {
        cacheModules: {}
    });

    basicFeature.extend(Module.prototype, {
        clone: function (id) {
            return new this.constructor(id);
        },

        complete: function () {
            var self = this;

            return function () {
                var module = Module.cacheModules[self.id];
                var deps = typeof module.$deps === 'string' ? [module.$deps] : module.$deps;

                if (!deps || !deps.length) {
                    module.status = 4;
                    self.exec();
                    return;
                }

                module.count = 0;

                deps.forEach((function (dep) {
                    this.clone(dep, this);
                }).bind(self));
            };
        },

        exec: function () {
            var cacheModule = Module.cacheModules;
            var factory = this.factory;
            var factoryArgsArray = this.factoryArgsArray;
            var module = null;
            var parentModule = this.parentId && cacheModule[this.parentId];
            var modules = factoryArgsArray && factoryArgsArray.reduce(function (initModules, nextName) {
                if ((module = cacheModule[nextName])) initModules.push(module);

                return initModules;
            }, []), parentModuleDeps;

            // 如果有父模块，并且加载完成，则当前当前模块是子模块
            if (parentModule && parentModule.status === 4) {
                parentModuleDeps = parentModule.deps;

                // 父模块依赖全部完成，可以调用父类模块注册的factory
                if (parentModule.count >= parentModuleDeps.length) {
                    parentModule.factory.apply(parentModule)
                }

                parentModule.deps[parentModule.count++] = this;
            } else {
                factory.apply(this, modules);
            }
        },

        injectFactory: function (fn) {
            // 注册当前模块对象的factory方法
            // 得到factory所要调用的模块标识集合
            this.factory = fn;
            this.factoryArgsArray = fn.toString().match(fnArgsExp)[1].split(',');
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
     * 设置模块导出对象
     *
     * @param {Function} fn 类
     */
    exports.setModuleExports = function (fn) {
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
        return new Module(id);
    };

    /**
     * 得到模块导出对象
     *
     * @param {String} id 模块标识
     * @return {Glass}
     */
    exports.getModuleExports = function (id) {
        return Module.cacheModules[id];
    };

    return exports;
});