import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AuthService } from "../../providers/auth-service/auth-service";
import { AsistenciaProvider }  from "../../providers/asistencia/asistencia";
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File } from '@ionic-native/file';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  CameraPosition,
  MarkerOptions,
  Marker
} from '@ionic-native/google-maps';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';

/**
 * Generated class for the CheckoutPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-checkout',
  templateUrl: 'checkout.html',
})
export class CheckoutPage {

  operador:any;
  planta:any;
  ubicacion:any;
  lat:any;
  lng:any;
  map:any;
  markerUsuario:any;

  images = [];

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private authservice: AuthService,
              public geolocation: Geolocation,
              private locationAccuracy: LocationAccuracy,
              private googleMaps: GoogleMaps,
              private alertCtrl: AlertController,
              private asistenciaProv: AsistenciaProvider,
              private camera: Camera,
              private file: File) {

      this.operador = this.authservice.AuthToken.usuario;
      this.planta = this.authservice.AuthToken.planta;
      this.ubicacion = this.planta.billingstreet;
      this.lat = 0;
      this.lng = 0;
      this.cargarMapa();
      this.markerUsuario = null;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CheckoutPage');
  }

  //Método para capturar imágenes con el dispositivo.
  capturar(){
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: this.camera.PictureSourceType.CAMERA,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }

    this.camera.getPicture(options).then((imagePath) => {
      this.images.push(imagePath)

    }, (err) => {
     // Handle error
    });
  }

  /*Muevo el archivo de la carpeta donde se guarda la imagen capturada,
  a una carpeta que 'salidas' que le creo.
  */
  moverArchivo(images:string[]){
    var dataDirectory=this.file.dataDirectory;
    var origen = dataDirectory + 'salidas/'
    var sourceDirectory = images[0].substring(0, images[0].lastIndexOf('/') + 1);
    var destino = dataDirectory + 'salidas/';

    //Verifico si existe el directorio 'salidas'.
    this.validarDirectorio(dataDirectory, 'salidas').then(response=>{
      if(response){
        //Existe la carpeta
        this.crearCarpetas(origen, sourceDirectory, destino, images);
      }
      else{
        //NO Existe la carpeta 'salidas', entonces la creo
        this.file.createDir(dataDirectory, 'salidas', false).then(data=>{
          this.crearCarpetas(origen, sourceDirectory, destino, images);
        }, err =>{
          // this.presentToast('Error al crear la carpeta Rutinas: ' + err);
        });
      }
    }, error =>{

    })


  }

  //Funcion que crea una carpeta con el nombre de la fecha actual para guardar las imágenes.
  crearCarpetas(origen, sourceDirectory, destino, images){
    var today = new Date().toString()
    //Creo la carpeta con el dia actual
    this.file.createDir(origen, today, false).then(data=>{

      //Muevo todas las imágenes al nuevo directorio.
      for (let i = 0; i < images.length; i++) {
          var fileName = images[i].substring(images[i].lastIndexOf('/') + 1, images[0].length);
          this.file.moveFile(sourceDirectory,fileName,destino,fileName)
          .then(
            file=>{

            }, error => {
            // this.presentToast("ERROR MOVIENDO: " + error.message + "   ...error: " + error)
          })
      }

    }, err =>{
      // this.presentToast('Error al crear la carpeta id: ' + err)
    });
  }

  // Funcion que verifica si existe un subdirectorio
  validarDirectorio(dataDirectory, subDirectorio){
    return new Promise(resolve=>{
      this.file.checkDir(dataDirectory, subDirectorio)
                .then(_ => {
                  resolve(true);
                })
                .catch(err => {
                  resolve(false);
                  // this.presentToast('Error al crear Directorio: ' + err)
                  // });
      });
    });
  }

  //Función que elimina una imagen capturada.
  eliminarImagen(pos:number, imagen:string){
    var directorio = imagen.substring(0, imagen.lastIndexOf('/') + 1);
    var nombreArchivo = imagen.substring(imagen.lastIndexOf('/') + 1, imagen.length);
    this.file.removeFile(directorio, nombreArchivo);
    this.images.splice(pos, 1)
  }

  cargarMapa(){
    //Función para cargar el mapa. Indico posición donde se debe centrar y el zoom.
    let mapOptions: GoogleMapOptions = {
      camera: {
        target: {
          lat: this.planta.billinglatitude, // default location
          lng: this.planta.billinglongitude // default location
        },
        zoom: 18,
        tilt: 30
      }
    };

    this.map = GoogleMaps.create('map_canvas', mapOptions);

    // Wait the MAP_READY before using any methods.
    this.map.one(GoogleMapsEvent.MAP_READY)
    .then(() => {

      // Now you can use all methods safely.
      this.map.moveCamera({
        target: {lat: this.planta.billinglatitude, lng: this.planta.billinglongitude}
      });

      //Agrego un círculo indicando el radio máximo para hacer el ingreso sin advertencia.
      this.map.addCircle({
        center:{lat: this.planta.billinglatitude, lng: this.planta.billinglongitude},
        radius: this.planta.radio__c,
        strokeColor: '#FF0000',
        strokeWidth: 2,
        visible: true
      })

      //Agrego el marcador de la planta.
      this.map.addMarker({
        title: 'Planta: ' + this.planta.name,
        icon: 'blue',
        animation: 'DROP',
        position: {lat: this.planta.billinglatitude, lng: this.planta.billinglongitude}
      });
      this.obtenerUbicacion();
    })
    .catch(error =>{
      console.log(error);
    });

  }

  //Método para mostrar una alerta. Si envío una página debe redirigirme.
  showAlert(title:string, subtitle:string, page:string) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subtitle,
      buttons: [{
        text: 'Aceptar',
        handler: data => {
          if(page){
            this.navCtrl.setRoot(page);
          }
        }
      }]
    });
    alert.present();
  }

  //Convierto en radianes
  deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  //Obtengo la ubicación del dispositivo utilizando el GPS
  obtenerUbicacion(){

    this.locationAccuracy.canRequest().then((canRequest: boolean) => {
      // if(canRequest) {
        // the accuracy option will be ignored by iOS
        //En caso de que no esté prendido, solicito acceso para activarlo
        this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(() =>{

            //Si me da acceso, obtengo la posición

            this.geolocation.getCurrentPosition().then((resp) => {
              this.lat = resp.coords.latitude;
              this.lng = resp.coords.longitude;

              //Si ya existe un marcador en el mapa del usuario, lo remuevo.
              if(this.markerUsuario){
                this.markerUsuario.remove()
              }

              //Agrego el marcador de la posición actual.
              this.map.addMarker({
                title: this.operador.name,
                icon: 'red',
                animation: 'DROP',
                position: {lat: this.lat, lng: this.lng}
              }).then(response=>{
                console.log('response: ' + response)
                console.log('responseJSON: ' + JSON.stringify(response))
                this.markerUsuario = response;
              });

               console.log("Lat: " + resp.coords.latitude);
               console.log("Lng: " + resp.coords.longitude);
            }).catch((error) => {
              console.log('Error getting location', error);
            });
        }, error => {
          console.log('Error requesting location permissions', error)
        });
      // }

    });

  }

  guardar(){

    /*Calculo la distancia que existe entre 2 puntos
    (latitud1;longitud1 contra latitud2;longitud2). */

    if(!this.images || this.images.length == 0){
      this.showAlert('Salida Laboral', 'Para realizar la salida debe cargar al menos una evidencia.', null);
      return;
    }

    var R = 6371; // Radius of the earth in km
    var lat1 = this.lat;
    var lng1 = this.lng;
    var lat2 = this.planta.billinglatitude;
    var lng2 = this.planta.billinglongitude;
    var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = this.deg2rad(lng2-lng1);
    var a =
             Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
             Math.sin(dLon/2) * Math.sin(dLon/2)
             ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var distancia = R * c; // Distance in km
    distancia = distancia * 1000;


    //Si la distancia es mayor al radio muestro una advertencia
    if(distancia > this.planta.radio__c){
      let alert = this.alertCtrl.create({
        title: 'Salida Laboral',
        subTitle: 'Usted se encuentra a una distancia mayor a la establecida para realizar la Salida. ¿Desea continuar?',
        buttons: [{
          text: 'Aceptar',
          handler: data => {
            this.postAsistencia();
          }
        }, 'Cancelar']
      });
      alert.present();
    }else{
      this.postAsistencia();
    }

  }


  //Realizo la entrada laboral del operador, indicando latitud y longitud actual.
  postAsistencia(){
    this.asistenciaProv.postAsistencia('Salida', this.operador.sfid, this.lat, this.lng).then(response => {
      if(response){
        this.asistenciaProv.getAsistencia(this.authservice.AuthToken.usuario.sfid);
        if(this.images.length > 0){
          this.moverArchivo(this.images);
        }
        this.showAlert("Salida Laboral", "Salida Exitosa", 'HomePage');
      }
    }, error => {
      console.log('error: ' + error)
      console.log('errorJSON: ' + JSON.stringify(error))
    })
  }

}