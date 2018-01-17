import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import { TicketsProvider } from "../../providers/tickets/tickets";
import { AuthService } from "../../providers/auth-service/auth-service";

@IonicPage()
@Component({
  selector: 'page-nuevo-ticket',
  templateUrl: 'nuevo-ticket.html',
})
export class NuevoTicketPage {

  loading: boolean;

  description: string;
  ptarName:string;
  ptarDate:string;
  ticketType:string;
  serviceType:string;
  images = [];
  motivoSeleccionado:any;
  descripcionSeleccionada: any;
  motivoDesestabilizacionSeleccionado : any;
  clienteSeleccionado:any;
  clientes:any;
  motivos;
  descripcionesMotivos;
  motivosDesestabilizacion;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private camera: Camera,
              private file: File,
              private alertCtrl: AlertController,
              private ticketsProv: TicketsProvider,
              private authservice: AuthService) {

    this.loading = false;
    this.ptarName = this.authservice.AuthToken.planta.name;
    this.ptarDate = new Date().toISOString();
    this.ticketType = "Interno";
    this.description = "";
    this.serviceType = "";
    this.motivoSeleccionado = null;
    this.descripcionSeleccionada = null;
    this.clientes = [];

    this.getMotivosOportunidades();
    this.getClientesPlanta();
  }

  ionViewDidLoad() {
    // console.log('ionViewDidLoad NuevoTicketPage');
  }

  cancel(){
    this.navCtrl.pop();
  }

  //Método para capturar imágenes y guardarlas en un array.
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

    private presentToast(text) {
      let toast = this.alertCtrl.create({
        message: text,
        buttons: ['Aceptar']
      });
      toast.present();
    }

    /*Muevo el archivo de la carpeta donde se guarda la imagen capturada,
    a una carpeta que 'tickets' que le creo.
    */
  moverArchivo(images:string[], id){

    var dataDirectory=this.file.dataDirectory;
    var origen = dataDirectory + 'tickets/'
    var sourceDirectory = images[0].substring(0, images[0].lastIndexOf('/') + 1);
    var destino = dataDirectory + 'tickets/' + id.toString() + '/';

    //Verifico si existe el directorio 'tickets'.
    this.validarDirectorio(dataDirectory, 'tickets').then(response=>{
      if(response){
        //Existe la carpeta
        this.crearCarpetasId(origen, sourceDirectory, destino, images, id);
      }
      else{
        //NO Existe la carpeta 'rutinas', entonces la creo
        this.file.createDir(dataDirectory, 'tickets', false).then(data=>{
          this.crearCarpetasId(origen, sourceDirectory, destino, images, id);
        }, err =>{

        });
      }
    }, error =>{

    })

  }

  //Funcion que crea una carpeta con el nombre del ID para guardar las imágenes.
  crearCarpetasId(origen, sourceDirectory, destino, images, id){
    //Creo la carpeta con el nombre {ID}
    this.file.createDir(origen, id.toString(), false).then(data=>{

      //Muevo todas las imágenes al nuevo directorio.
      for (let i = 0; i < images.length; i++) {

          var fileName = images[i].substring(images[i].lastIndexOf('/') + 1, images[0].length);

          this.file.moveFile(sourceDirectory,fileName,destino,fileName)
          .then(
            file=>{

            }, error => {

          })
      }

    }, err =>{

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

  //Método para ordenamiento
  ordenar(item1, item2){
    return (item1 < item2 ? -1 : (item1 === item2 ? 0 : 1));
  }

  //Get para buscar los motivos y ordenarlos por orden alfabético
  getMotivosOportunidades(){
    this.ticketsProv.getMotivosOportunidades().subscribe(response =>{
      this.motivos = response.data.sort((item1, item2): number => this.ordenar(item1.name, item2.name));
    }, error =>{

    })
  }

  //Get para buscar las descripciones del motivo que selecciono
  getDescripcionMotivos(motivo){
    if(motivo){
      this.ticketsProv.getDescripcionMotivos(motivo.sfid).subscribe(response =>{
        this.descripcionesMotivos =  response.data.sort((item1, item2): number => this.ordenar(item1.name, item2.name));
        this.motivosDesestabilizacion = null;
        this.descripcionSeleccionada = null;
        this.motivoDesestabilizacionSeleccionado = null;
      }, error=>{
        this.descripcionesMotivos = null;
      })
    }
  }

  // Get para buscar el motivo de desestabilización.
  getMotivosDesestabilizacion(descripcion){
    if(descripcion){
      this.ticketsProv.getMotivosDesestabilizacion(descripcion.sfid).subscribe(response =>{
        this.motivosDesestabilizacion = response.data.sort((item1, item2): number => this.ordenar(item1.name, item2.name));
        this.motivoDesestabilizacionSeleccionado = null;

      }, error=>{
        this.motivoDesestabilizacionSeleccionado = null;
        this.motivosDesestabilizacion = null;
      })
    }
  }

  getClientesPlanta(){
    this.ticketsProv.getClientesPlanta(this.authservice.AuthToken.planta.sfid).subscribe(response =>{
      this.clientes = response.data.sort((item1, item2): number => this.ordenar(item1.name, item2.name));

    }, error=>{

    })
  }

  createTicket(){
    this.loading = true;
    var data = {
      'description' : this.description,
      'enviaagua__c' : this.serviceType,
      'origin': 'App. Sistema de Monitoreo Sytesa',
      'idplanta__c': this.authservice.AuthToken.planta.sfid,
      'operadorapp__c': this.authservice.AuthToken.usuario.sfid,
      'reason': this.motivoSeleccionado.name,
      'descripciondefalla__c' : this.descripcionSeleccionada ? this.descripcionSeleccionada.name : null,
      'motivodedesestabilizacion__c': this.motivoDesestabilizacionSeleccionado ? this.motivoDesestabilizacionSeleccionado.name : null,
      'accountid' : this.clienteSeleccionado
    }
    // console.log(data);
    this.ticketsProv.createTicket(data).then(response=>{
      if(response){
        if(this.images.length > 0){
          this.moverArchivo(this.images, response);
        }
        this.loading = false;
        this.navCtrl.pop();
      }else{
        this.loading = false;
      }
    }, error=>{
      this.loading = false;
    });
  }

}
