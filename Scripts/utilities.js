/*********************************************************/
/******************* Helping Method **********************/
function goBack()
{
	history.go(-1);
}

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

function searchAction()
{
	NavigatePage("#pgSearch?keyword=" + $('#searchCatalogs').val() + "&systemtype=" + $("#filterDocumentType").val());
	performSearch();
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
				
					$("#searchCatalogs").val(barcodeText);
					navigator.notification.vibrate(20);
					
					NavigatePage("#pgSearch?keyword=" + $('#searchCatalogs').val() + "&systemtype=" + $("#filterDocumentType").val());
					performSearch();
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
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.href)||[,""])[1].replace(/\+/g, '%20'))|| "";
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
	getUserInfoDefault: function() {
		return {"AuthenticationHeader" : "", "DisplayName" : "", "Email" : "", "Phone" : "", "Expiration" : 0 };
	}
};

function getTimestamp()
{
	var d = new Date();
	return d.getTime();
}
