/*********************************************************/
/******************* Helping Method **********************/

function goHome()
{
	NavigatePage("#pgHome");
}

function addStatusAction(id)
{
	NavigatePage('#pgAddStatus?id=' + id);
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

function scanBarcode() 
{
	try {
		if (typeof cordova !== 'undefined' && $.isFunction(cordova.plugins.barcodeScanner.scan)) {
			cordova.plugins.barcodeScanner.scan(
				function (result) {
					var barcodeText = result.text;
					if (barcodeText.lastIndexOf(";") > 0)
						barcodeText = barcodeText.substring(barcodeText.lastIndexOf(";") + 1);
					
					if (barcodeText != "")
					{
						$("#searchCatalogs").val(barcodeText);
						navigator.notification.vibrate(20);
						performSearch();
					}
				}, 
				function (error) {
					alert("Scanning failed: " + error);
				}
			);
		}
	}
	catch(err) { }
}

function scanSerialNumBarcode() 
{
	try {
		if (typeof cordova !== 'undefined' && $.isFunction(cordova.plugins.barcodeScanner.scan)) {
			cordova.plugins.barcodeScanner.scan(
				function (result) {
					var barcodeText = result.text;
					if (barcodeText.lastIndexOf(";") > 0)
						barcodeText = barcodeText.substring(barcodeText.lastIndexOf(";") + 1);
					
					if (barcodeText != "")
					{
						$("#inputSystemSerialNumber").val(barcodeText);
						navigator.notification.vibrate(20);
					}
				}, 
				function (error) {
					alert("Scanning failed: " + error);
				}
			);
		}
	}
	catch(err) { }
}

function ShowHelp()
{
	NavigatePage( "#pgHelp" );
}

function RefrestApp()
{
	location.href='index.html#pgHome';
	location.reload(true);
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
		return {"AuthenticationHeader" : "", "DisplayName" : "", "Email" : "", "Phone" : "", "Expiration" : 0 };
	},
	getHistoryDefault: function() {
		return {"History" : "", "Expiration" : 0 };
	}
};

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