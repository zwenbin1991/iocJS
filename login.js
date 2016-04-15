function Login () {
    this.$id = 'login';
}

Login.prototype.login = function () {
    console.log('this is login method');
};

iocJS.setModuleExports(Login);