function Main () {
    this.$id = 'main';
    this.$deps = ['reg', 'login'];
}

Main.prototype.getTotalValue = function () {
    this.$reg.register();
    this.$login.login();
};

iocJS.setModuleExports(Main);