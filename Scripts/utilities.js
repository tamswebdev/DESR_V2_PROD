/*********************************************************/
/******************* Helping Method **********************/
/*
function goBack()
{
	var navHistory = [];
	if (localstorage.get("navHistory") != null && localstorage.get("navHistory").History != "" && localstorage.get("navHistory").Expiration > getTimestamp())
	{
		navHistory = localstorage.get("navHistory").History.split(";");
	}
	if (navHistory.length > 1)
	{
		navHistory.pop();
		localstorage.set("navHistory", {"History" : navHistory.join(";"), "Expiration" : getTimestamp() + 180000});
		var _backUrl = navHistory[navHistory.length - 1];
		NavigatePage(_backUrl);
		
		if (_backUrl.toLowerCase().indexOf("#pgsearch") >= 0)
			location.reload(true);
	}
	else
	{
		localstorage.clearHistory("navHistory");
		NavigatePage("#pgHome");
	}
}
*/

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

function searchAction(refresh)
{
	refresh = typeof refresh !== 'undefined' ? refresh : true;
	var _searchurl = "index.html#pgSearch?keyword=" + _encodeURIComponent($('#searchCatalogs').val()) + "&systemtype=" + _encodeURIComponent($("#filterDocumentType").val());
	location.replace(_searchurl);
	if (refresh)
		location.reload(true);
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
						searchAction();
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




$.urlParam = function(name){
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20')).replace("(FSLASH)","/").replace("(BSLASH)","\\") || "";
}

function _encodeURIComponent(value)
{
	value = value.replace("/", "(FSLASH)").replace("\\", "(BSLASH)");
	return encodeURIComponent(value);
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