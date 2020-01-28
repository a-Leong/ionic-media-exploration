import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { MediaCapture } from '@ionic-native/media-capture/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(
    private plt: Platform,
    private mediaCapture: MediaCapture,
    private camera: Camera,
    private webview: WebView
  ) {}

  ngOnInit() {
    this.plt.ready()
      .then(() => {
        console.log("All ready to go!");
      });
  }

  // Captures a photo using the Cordova Camera Plugin
  public async takePicture() {
    const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        encodingType: this.camera.EncodingType.,
        mediaType: this.camera.MediaType.PICTURE
    }
  
    const tempPhoto = await this.camera.getPicture(options);
    const webSafePhoto = this.webview.convertFileSrc(tempPhoto);
    const response = await fetch(webSafePhoto);
  
    // Different data response options:
    const photoBlob = await response.blob();
    const photoArrayBuffer = await response.arrayBuffer();
  }
}
