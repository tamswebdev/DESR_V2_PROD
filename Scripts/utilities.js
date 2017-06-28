/*********************************************************/
/******************* Helping Method **********************/

function goHome()
{
	NavigatePage("#pgHome");
}

function addStatusAction(id, sid, serial)
{
    if (sid != "")
        NavigatePage('#pgAddStatus?sid=' + sid);
    else
        NavigatePage('#pgAddStatus?id=' + id + '&serial=' + serial);
}
  
function showAboutMeMenu() 
{
	$( "#popupAboutMe" ).popup( "open" )
}
  
function showTimedElem(id)
{
	$("#" + id).show();
}

function NavigatePage(pageid)
{
	$.mobile.navigate(pageid, { transition : "slide"});
}

//function scanBarcode() 
//{
//	try {
//		if (typeof cordova !== 'undefined' && $.isFunction(cordova.plugins.barcodeScanner.scan)) {
//			cordova.plugins.barcodeScanner.scan(
//				function (result) {
//					var barcodeText = result.text;
//					var BarCodeData = barcodeText.split(";");
//					if (barcodeText.lastIndexOf(";") > 0)
//					{
//						//barcodeText = barcodeText.substring(barcodeText.lastIndexOf(";") + 1);
//						barcodeText = BarCodeData[3];
//					}
//					if (barcodeText != "")
//					{
//						$("#searchCatalogs").val(barcodeText);
//						navigator.notification.vibrate(20);
//						performSearch();
//					}
//				}, 
//				function (error) {
//					alert("Scanning failed: " + error);
//				}
//			);
//		}
//	}
//	catch(err) { }
//}

function setOptions(srcType) {
    var options = {
        // Some common settings are 20, 50, and 100 
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        // In this app, dynamically set the picture source, Camera or photo gallery 
        sourceType: srcType,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true  //Corrects Android orientation quirks 
    }
    return options;
}

//function SnapPhoto() {

//    navigator.camera.getPicture(
//      alert('success'),
//      function (message) { alert('No picture taken'); },
//      {
//          quality: 50,
//          destinationType: navigator.camera.DestinationType.FILE_URI,
//          sourceType: navigator.camera.PictureSourceType.CAMERA,
//          encodingType: navigator.camera.EncodingType.JPEG,
//          targetWidth: 640,
//          targetHeight: 480
//      }
//    );
//}


//function openCamera() {
//    try {
//        if (navigator.camera == null) {
//            alert('navigator.camera is null');
//        }
//        else {

//            navigator.camera.getPicture(
//                 function cameraSuccess(imageUri) {

//                     var image = $("#imgTest");
//                     image.src = imageUri;

//                 },
//                 function (message) { alert('No picture taken'); },
//                 {
//                     quality: 50,
//                     destinationType: navigator.camera.DestinationType.FILE_URI,
//                     sourceType: navigator.camera.PictureSourceType.CAMERA,
//                     encodingType: navigator.camera.EncodingType.JPEG,
//                     targetWidth: 640,
//                     targetHeight: 480
//                 }
//               );
//        }
//    }
//    catch (ex)
//    {
//        alert(ex);            
//    }
//}

//function scanSerialNumBarcode() 
//{
//	try {
//		if (typeof cordova !== 'undefined' && $.isFunction(cordova.plugins.barcodeScanner.scan)) {
//			cordova.plugins.barcodeScanner.scan(
//				function (result) {
//					var barcodeText = result.text;
//					var BarCodeData = barcodeText.split(";");
//					if (barcodeText.lastIndexOf(";") > 0)
//					{
//						//barcodeText = barcodeText.substring(barcodeText.lastIndexOf(";") + 1);
//						barcodeText = BarCodeData[3];
//					}

//					if (barcodeText != "")
//					{
//						$("#inputSystemSerialNumber").val(barcodeText);
//						navigator.notification.vibrate(20);
//					}
//				}, 
//				function (error) {
//					alert("Scanning failed: " + error);
//				}
//			);
//		}
//	}
//	catch(err) { }
//}

function ShowHelp()
{
	NavigatePage( "#pgHelp" );
}



function ToggleTheme(ThemeChanged)
{
	var ThemeID = localstorage.get("ThemeID");
	

	if (ThemeID == null && ThemeID == ""){
		ThemeID=0;
		localstorage.set("ThemeID",ThemeID);
		
	}
	
	if (ThemeChanged==1)
	{
		ThemeID=Math.abs(ThemeID - 1);
		localstorage.set("ThemeID",ThemeID);
		
	}
	
	if (ThemeID!=0)
	{
			var head  = document.getElementsByTagName('head')[0];
			var link  = document.createElement('link');
			link.id   = 'NotDefaultTheme';
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = 'Content/umer001-tams001/UMER001-TAMS001.css';
			link.media = 'all';
			head.appendChild(link);

	}
	else
	{
		//if (ThemeChanged==1)
		//{
			var element = document.getElementById("NotDefaultTheme"); 
			if (element)
				element.parentNode.removeChild(element);

		//}
		
	}

	if (ThemeChanged==1)
			RefrestApp();
		


}

function RefrestApp()
{
	location.href='index.html#pgHome';
	location.reload(true);
}

function RefrestPage() {
    location.reload(false);
}


$.urlParam = function(name){
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20')).replace("(FSLASH)","/").replace("(BSLASH)","\\") || "";
}

$.urlParamRedirect = function(name){
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20')) || "";
}

function _encodeURIComponent(value)
{
	value = value.replace("/", "(FSLASH)").replace("\\", "(BSLASH)");
	return encodeURIComponent(value);
}
function _decodeURIComponent(value)
{
	value = value.replace("(FSLASH)", "/").replace("(BSLASH)", "\\");
	return decodeURIComponent(value);
}

function getLoadingImg()
{
	return '<img style="margin-top: 20px;" src="Images/loading.gif" border="0" />';
}

function getLoadingMini()
{
	return '<img src="Images/ajax-loader-min.gif" border="0" />';
}



var localstorage = {
    set: function (key, value) {
        window.localStorage.setItem( key, JSON.stringify(value) );
    },
    get: function (key) {
        try {
			if (window.localStorage.getItem(key) === null)
				return null;
			else
				return JSON.parse( window.localStorage.getItem(key) );
        } catch (e) {
            return null;
        }
    },
	clear: function(key) {
		window.localStorage.setItem( key, JSON.stringify(this.getUserInfoDefault()) );
		return this.getUserInfoDefault();
	},
	clearHistory: function(key) {
		window.localStorage.setItem( key, JSON.stringify(this.getHistoryDefault()) );
		return this.getHistoryDefault();
	},
	getUserInfoDefault: function() {
	    return { "AuthenticationHeader": "", "DisplayName": "", "Email": "", "Phone": "", "Expiration": 0, "CurrentSpecialist": "" };
	},
	getHistoryDefault: function() {
		return {"History" : "", "Expiration" : 0 };
	}
};

function IsEmail(email)
{      
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    return re.test(email);
} 


function getISOTodayDateString(DateString)
{
	if (DateString)
	{
		var d = new Date(DateString);
		return ConvertToISO(d).substring(0,10);
	}
	else
	{
		return "";
	}

}

function ConvertToISO(d){		
 function pad(n){return n<10 ? '0'+n : n}
 return (d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z').substring(0,10)}
	  


function NowDate(){		
 function pad(n){return n<10 ? '0'+n : n}
 var d = new Date();
 return (d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z').substring(0,10)}
	  
function Now(){		
 function pad(n){return n<10 ? '0'+n : n}
 var d = new Date();
 return d.getFullYear()+'-'
      + pad(d.getMonth()+1)+'-'
      + pad(d.getDate())+'T'
      + pad(d.getHours())+':'
      + pad(d.getMinutes())+':'
      + pad(d.getSeconds())+'Z'}
	  
	  
function getTimestamp()
{
	var d = new Date();
	return d.getTime();
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function SetRadioValue(name, SelectdValue) {
    $('input[name="' + name+ '"][value="' + SelectdValue + '"]').prop('checked', true);
}

navigator.browserDetail = (function(){
    var N= navigator.appName, ua= navigator.userAgent, tem;
    var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
    M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
    return M;
})();


function ShowHelpSection(id)
{
	$('html, body').animate({
        scrollTop: $(id).offset().top -80
    }, 1000);
}


function GetTokenIndex(str, split, index) {
    var tokens = str.split(split);
    if (tokens.length > index)
        return tokens[index];
    else
        return "";
}