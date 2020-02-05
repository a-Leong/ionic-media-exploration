import { Component, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { MediaCapture, MediaFile, CaptureError } from '@ionic-native/media-capture/ngx';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
// import { DOCUMENT } from '@angular/common';
import { File, FileEntry } from '@ionic-native/File/ngx';

// Web implementation of Filesystem Plugin didn't work — can only write string
// import { FilesystemDirectory, FilesystemEncoding, FileWriteOptions } from '@capacitor/core'
// // const { Filesystem } = Plugins // => Doesn't work with blob in native
// // Workaround: Use Web-Implementation of plugin
// import { FilesystemPluginWeb } from '@capacitor/core/dist/esm/web/filesystem.js'
// const Filesystem = new FilesystemPluginWeb()

const MEDIA_FOLDER_NAME = "mediaStuff";
const MEDIA_FILE_NAME = "myMedia";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('videoSource', { static: false })
  public videoSource: ElementRef;

  @ViewChild('video', { static: false })
  public video: ElementRef;

  @ViewChild('image', { static: false })
  public image: ElementRef;

  public loadVideo(url: string) {
    this.videoSource.nativeElement.src = url;
    this.video.nativeElement.hidden = false;
    this.video.nativeElement.load();
  }

  public loadImage(url: string) {
    this.image.nativeElement.src = url;
    this.image.nativeElement.hidden = false;
  }

  // constructor(@Inject(DOCUMENT) document,
  constructor(
    private plt: Platform,
    private mediaCapture: MediaCapture,
    private camera: Camera,
    private webview: WebView,
    private file: File
  ) {}

  ngOnInit() {
    this.plt.ready()
      .then(
        () => {
          let path = this.file.dataDirectory;
          this.file.checkDir(path, MEDIA_FOLDER_NAME)
            .then(
              () => {
                // LOAD PERSISTENT IMAGE
                this.file.checkFile(`${path}${MEDIA_FOLDER_NAME}/`, `${MEDIA_FILE_NAME}.jpg`)
                  .then(exists => {
                    if (exists) {
                      console.log("image file exists", 67);
                      const imagePath = `${path}${MEDIA_FOLDER_NAME}/${MEDIA_FILE_NAME}.jpg`;
                      this.loadImage(this.webview.convertFileSrc(imagePath));
                    } else {
                      console.log("image file doesn't exist", 71);
                    }
                  },
                  error => {
                    console.error("Cannot find file", error);
                  });
                // LOAD PERSISTENT VIDEO
                this.file.checkFile(`${path}${MEDIA_FOLDER_NAME}/`, `${MEDIA_FILE_NAME}.MOV`)
                  .then(exists => {
                    if (exists) {
                      console.log("video file exists", 76);
                      const videoPath = `${path}/${MEDIA_FOLDER_NAME}/${MEDIA_FILE_NAME}.MOV`;
                      this.loadVideo(this.webview.convertFileSrc(videoPath));
                    } else {
                      console.log("video file doesn't exist", 82);
                    }
                  },
                  error => {
                    console.error("Cannot find file", error);
                  });
              },
              () => {
                console.log("Making media directory.");
                this.file.createDir(path, MEDIA_FOLDER_NAME, false);
              }
            );
      },
      error => {
        console.error("platform never ready", error);
      });
  }

  // Captures a photo using the Cordova Camera Plugin
  public async takePicture() {
    const options: CameraOptions = {
        quality: 100,
        destinationType: this.camera.DestinationType.FILE_URI,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE
    }
  
    const tempPhoto = await this.camera.getPicture(options);

    this.copyFileToLocalDir(tempPhoto);

    // const webSafePhoto = this.webview.convertFileSrc(tempPhoto);
    // const response = await fetch(webSafePhoto);

    // this.loadImage(webSafePhoto);

    // console.log(tempPhoto);
    // console.log(webSafePhoto);
    // console.log(response);
  
    // // Different data response options:
    // const photoBlob = await response.blob();
    // const photoArrayBuffer = await response.arrayBuffer();
  }

  takeVideo() {
    this.mediaCapture.captureVideo()
      .then(
        async (data: MediaFile[]) => {
          if (data.length > 0) {
            this.copyFileToLocalDir(data[0].fullPath);
          }
        },
        error => {
          console.error("Unable to capture video", error);
        }
      );
  }

  copyFileToLocalDir(fullPath: string) {
    let myPath = fullPath;
    // Make sure we copy from the right location
    if (fullPath.indexOf('file://') < 0) {
      myPath = 'file://' + fullPath;
    }
 
    const ext = myPath.split('.').pop();
    // const d = Date.now();
    // const newName = `${d}.${ext}`;
    const newName = `${MEDIA_FILE_NAME}.${ext}`;
 
    const name = myPath.substr(myPath.lastIndexOf('/') + 1);
    const copyFrom = myPath.substr(0, myPath.lastIndexOf('/') + 1);
    const copyTo = this.file.dataDirectory + MEDIA_FOLDER_NAME;
    
    console.log(copyFrom);
    console.log(name);
    console.log(copyTo);
    console.log(newName);

    this.file.checkFile(copyTo + "/", newName)
      .then(
        exists => {
          if (exists) {
            console.log("File exists!");
            this.file.removeFile(copyTo + "/", newName)
              .then(
                () => {
                  this.copyAndLoad(copyFrom, name, copyTo, newName);
                },
                error => {
                  console.error("Unable to remove file", error);
                });
          } else {
            console.log("File doesn't exist!");
            this.copyAndLoad(copyFrom, name, copyTo, newName);
          }
        },
        error => {
          console.log("Unable to find file", error);
          this.copyAndLoad(copyFrom, name, copyTo, newName);
        })
  }

  copyAndLoad(copyFrom: string, name: string, copyTo: string, newName: string) {
    this.file.copyFile(copyFrom, name, copyTo, newName)
      .then( 
        success => {
          console.log(success);
          const webSafeFile = this.webview.convertFileSrc(success.nativeURL);
          console.log(webSafeFile);
          if ( webSafeFile.indexOf('.MOV') > -1 || webSafeFile.indexOf('.mp4') > -1 ) {
            // is video
            this.loadVideo(webSafeFile);
          } else {
            // is image
            this.loadImage(webSafeFile);
          }
        },
        error => {
          console.log('error: ', error);
        }
      );
  }
}
