function Reg () {
    this.$id = 'reg';
}

Reg.prototype.register = function () {
    console.log('this is register method');
};

iocJS.setModuleExports(Reg);