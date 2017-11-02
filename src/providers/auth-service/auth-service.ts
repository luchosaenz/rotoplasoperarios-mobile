import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { AlertController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { URL_SERVICIOS } from "../../config/url.services";

@Injectable()
export class AuthService {

  isLoggedin: boolean;
  AuthToken;

  constructor(public http: Http,
              private alertCtrl: AlertController) {
    this.http = http;
    this.isLoggedin = false;
    this.AuthToken = null;
  }

  storeUserCredentials(token) {
    localStorage.setItem('currentUser', JSON.stringify(token));
    this.useCredentials(token);

  }

  useCredentials(token) {
    if(token){
      this.isLoggedin = true;
      this.AuthToken = token;
    }else{
      this.isLoggedin = false;
      this.AuthToken = null;
    }
  }

  loadUserCredentials() {
    var token = window.localStorage.getItem('currentUser');
    this.useCredentials(JSON.parse(token));
  }

  destroyUserCredentials() {
    this.isLoggedin = false;
    this.AuthToken = null;
    window.localStorage.clear();
  }

  authenticate(username, password) {
    var creds = "user=" + username + "&pass=" + encodeURIComponent(password);
    // var creds = {
    //   'user': username,
    //   'pass': password
    // }
    var headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    return new Promise(resolve => {
        this.http.post(URL_SERVICIOS + '/login', creds, {headers: headers}).subscribe(response => {
            var data = response.json().data
            if(data.activoc__c == "true"){  //ESTA PARTE DEBERIA CAMBIAR TAMBIEN SEGUN LO QUE RECIBA
                this.storeUserCredentials(data);   //CAMBIAR ESTO POR EL TOKEN
                resolve(true);
            }
            else{
              this.showAlert("Error al iniciar sesión", "El usuario se encuentra inactivo");
              resolve(false);
            }
        }, error =>{
          this.showAlert("Error al iniciar sesión", error.json().message);
        });
    });
  }

  adduser(user) {
    var creds = "name=" + user.name + "&password=" + user.password;
    var headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    return new Promise(resolve => {
        this.http.post('http://localhost:3333/adduser', creds, {headers: headers}).subscribe(data => {
            if(data.json().success){
                resolve(true);
            }
            else
                resolve(false);
        });
    });
  }

  getinfo() {
    return new Promise(resolve => {
        var headers = new Headers();
        this.loadUserCredentials();
        console.log(this.AuthToken);
        headers.append('Authorization', 'Bearer ' +this.AuthToken);
        this.http.get('http://localhost:3333/getinfo', {headers: headers}).subscribe(data => {
            if(data.json().success)
                resolve(data.json());
            else
                resolve(false);
        });
      })
    }

    logout() {
      this.destroyUserCredentials();
    }

    showAlert(title:string, subtitle:string) {
      let alert = this.alertCtrl.create({
        title: title,
        subTitle: subtitle,
        buttons: [{
          text: 'Ok'
        }]
      });
      alert.present();
    }

}
