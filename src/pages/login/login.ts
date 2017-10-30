import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController } from 'ionic-angular';
import { AuthService } from "../../providers/auth-service/auth-service";

/**
 * Generated class for the LoginPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  usercreds = {
       name: '',
       password: ''
  };

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private menuCtrl:MenuController,
              public authservice: AuthService) {

    if(this.authservice.isLoggedin){
      this.navCtrl.setRoot('HomePage');
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad LoginPage');
  }

  ionViewDidEnter() {
    //to disable menu, or
    this.menuCtrl.enable(false);
  }

  ionViewWillLeave() {
    // to enable menu.
    this.menuCtrl.enable(true);
  }

  login(user){
    this.authservice.authenticate(user.name, user.password).then(data => {
            if(data) {
              console.log("EN LOGIN LOGUEADO")
              this.navCtrl.setRoot('HomePage');  //setRoot para que no pueda volver atras con el boton del celular sino va a poder vovler al login despues de loguearse
            }else{
              console.log("EN LOGIN NO ME LOGUEEEE")
            }
    });
  }

  forgotPassword(){
    this.navCtrl.push('PasswordRecoveryPage'); //push para levantar una pagina de recuperar contraseña y que pueda
                                              // volver atras al login
  }

}
