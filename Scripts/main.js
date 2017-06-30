var serviceRootUrl = Configs.ServiceRootUrl;
var spwebRootUrl = Configs.SharePointRootUrl;
var SitePath = Configs.SitePath;
var MKTSitePath = Configs.MKTSitePath;
var EquipmentSitePath = Configs.EquipmentSitePath
var isPageLoadReady = false;
var isAppVersionChecking = false;
var isSkipPageLoad = "";
var isUserLogin = false;
var isWebBrowser = false;
var userInfoData = null;
var $scope = null;
var deviceInfo = "";

var userLongitude = 0;
var userLatitude = 0;

//var userSearchText = "";
var userSearchDemoRequest = "-1";
var userSearchSystemType = "All";

var pictureSource;   // picture source
var destinationType; // sets the format of returned value 


if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/) && location.href.toLowerCase().indexOf('http://') < 0 && location.href.toLowerCase().indexOf('https://') < 0) {
    document.addEventListener("deviceready", onDeviceReady, false);
} else {
    isWebBrowser = true;
    $(document).ready(function () {
        onDeviceReady(); //this is the browser
    });

}

function onDeviceReady() {
    $.mobile.pageLoadErrorMessage = "";

    //ToggleTheme(0);

    if (typeof device != 'undefined')
        deviceInfo = device.model + '|' + device.platform + '|' + device.version + '|App:' + AppVersion.version;
    else
        deviceInfo = "Browser:" + navigator.browserDetail + '|App:' + AppVersion.version;


    

    pictureSource = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;

    localstorage.set("DeviceInfo", deviceInfo);

    checkUserLogin();
    //initDemoRequestsDropDown();
    //LoadDemoRequestsDropDown();
    isPageLoadReady = true;

    NavigatePage("#pgHome");
};

$(document).on("pagebeforeshow", "#pgHome", function (event) {
    checkUserLogin();

    if (userInfoData != null && userInfoData.AuthenticationHeader != null) {
        try {
            var _url = serviceRootUrl + "svc.aspx?op=LogHomePage&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader;
            Jsonp_Call(_url, false, "");
        }
        catch (err) { }
    }

    $(".app-version-footer-text").html(AppVersion.version);
});


$(document).on("pagebeforeshow", "#pgHelp", function (event) {
    checkUserLogin();
    $("#td-error").text("");
    $("#spanHelpAppVersion").text(AppVersion.version);
});

$(document).on("pagebeforeshow", "#pgLogin", function (event) {
    checkUserLogin();
    $("#td-error").text("");
    $("#spanLoginAppVersion").text(AppVersion.version);

    $('#password').keyup(function (event) {
        if (event.which == 13) {
            $("#btnLoginSubmit").click();
        }
    });

});

$(document).on("pagebeforeshow", "#pgSearch", function (event) {
    checkUserLogin();

    $('.ui-content').on('click', '.ui-input-clear', function (e) {
        performSearch();
    });

    //$( "#searchCatalogs" ).keypress(function(e) {
    //	if (e.keyCode == 13) {
    //        performSearch();
    //    }
    //});

    //$("#filterDemoRequest").bind( "change", function(event, ui) {
    //performSearch();
    //});

    searchAction();
});

function CheckTouchIDAvailable() {
    var RetVal = false;
    if (typeof device != 'undefined')
    {
        //alert(device.platform + " -> version:" + device.version + " -> iphone: " + device.model);
        if (device.platform == 'iOS' && parseInt(device.version.substring(0,device.version.indexOf("."))) >= 8)
		{
			var Model=device.model.toLowerCase().replace('iphone','');
			if (parseInt(Model.substring(0, Model.indexOf(","))) >= 6)
				RetVal = true;				
			else
				RetVal=false;
		}				
	}
	return (RetVal);
}



function LoginUser() {
    if ($('#login') === undefined || $('#login').val() == '') {
        $('#td-error').html('Please provide login.');
        showTimedElem('td-error');
        return;
    }

    if ($('#password') === undefined || $('#password').val() == '') {
        $('#td-error').html('Please provide password.');
        showTimedElem('td-error');
        return;
    }

    $("#td-error").text("").append(getLoadingMini());

    var loginname = ($('#login').val().indexOf("@") > 0) ? $('#login').val().substring(0, $('#login').val().indexOf("@")) : $('#login').val();
    loginname = (loginname.indexOf("\\") > 0) ? loginname : "tamsdomain\\" + loginname;


    /* Umer: To add touch ID */
    //alert("CheckTouchIDAvailable() = " + CheckTouchIDAvailable());
    if (CheckTouchIDAvailable()) {
        localstorage.set("TouchIDAuthDESR", loginname);
    }
    else {
        localstorage.set("TouchIDAuthDESR", "0");
    }
    /* Umer: To add touch ID */


    userInfoData.AuthenticationHeader = Base64.encode(loginname + ":" + $('#password').val());
    var _url = serviceRootUrl + "svc.aspx?op=Authenticate&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&currentURL=" + serviceRootUrl + "main.html"
    Jsonp_Call(_url, true, "callbackLogin");
}

function callbackLogin(data) {
    try {
        if (data.d.results.issuccess) {

            userInfoData.DisplayName = data.d.results.name;
            userInfoData.ID = data.d.results.id;
            userInfoData.Email = data.d.results.email;
            userInfoData.Phone = data.d.results.phone;
            userInfoData.Login = data.d.results.loginname;
            userInfoData.CurrentSpecialist = userInfoData.ID + "|" + userInfoData.DisplayName + "|" + userInfoData.Login;

            $(".spanLoginUser").text("" + userInfoData.DisplayName);
            $(".spanCurrentSpecialist").text("" + GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));

            if ($('#rememberMe').is(':checked'))
                userInfoData.Expiration = getTimestamp() + 1210000000;	//2 weeks
            else
                userInfoData.Expiration = getTimestamp() + 14400000; //4 hours

            userInfoData.TouchIDAuthenticatedDESR = "1";

            localstorage.set("userInfoData", userInfoData);

            NavigatePage("#pgHome");
        }
        else {
            userInfoData = localstorage.getUserInfoDefault();

            if (CheckTouchIDAvailable()) {
                localstorage.set("TouchIDAuthDESR", "0");
            }
            $('#td-error').html("Invalid login and/or password.");


        }
    }
    catch (err) {
        $('#td-error').html("Internal application error.");
    }
}

/*
function initDemoRequestsDropDown()
{
	//Load Demo Requests from localstorage
	var localDemoRequests = localstorage.get("localDemoRequests");
	if (localDemoRequests != null && localDemoRequests != "")
	{
		$('#filterDemoRequest option[value!="-1"]').remove();			
		var _localDemoRequests = localDemoRequests.split(";");
		for (var i = 0; i < _localDemoRequests.length; i++)
		{
		    if (_localDemoRequests[i] != "") {

		        var _optionValueAndText = _localDemoRequests[i].split(":");
		        $("#filterDemoRequest").append("<option value='" + _optionValueAndText[0] + "' " + ((userSearchDemoRequest == $.trim(_optionValueAndText[0])) ? "selected" : "") + ">" + _optionValueAndText[1] + "</option>");
		        //$("#filterDemoRequest").append("<option value='" + _localDemoRequests[i] + "' " + ((userSearchDemoRequest == $.trim(_localDemoRequests[i])) ? "selected" : "") + ">" + _localDemoRequests[i] + "</option>");		        
		    }
		}
		
		try {
			$('#filterDemoRequest').selectmenu("refresh");
		} catch (err) {}
	}
}

function LoadDemoRequestsDropDown()
{
    
    //var _url = serviceRootUrl + "svc.aspx?op=GetSystemTypes&SPUrl=" + spwebRootUrl + EquipmentSitePath;
    var _url = serviceRootUrl + "svc.aspx?op=GetDemoRequestsForDropDown&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, true, "callbackPopulateDemoRequests");	
}

function callbackPopulateDemoRequests(data)
{
	try {
		if (data.d.results.length > 0)
		{
			$('#filterDemoRequest option[value!="-1"]').remove();
			
			var localDemoRequests = "";
			
			for (var i = 0; i < data.d.results.length; i++)
			{
			    var _optionValueAndText = data.d.results[i].split(":");
			    $("#filterDemoRequest").append("<option value='" + _optionValueAndText[0] + "' " + (userSearchDemoRequest == _optionValueAndText[0] ? " selected " : "") + ">" + _optionValueAndText[1] + "</option>");
			    //$("#filterDemoRequest").append("<option value='" + data.d.results[i] + "' " + (userSearchDemoRequest == data.d.results[i] ? " selected " : "") + ">" + data.d.results[i] + "</option>");
				localDemoRequests += data.d.results[i] + ";";
			}		
			
			try {
				//$('#filterDemoRequest').selectmenu("refresh");
			} catch (err) { alert(err); }
			
			localstorage.set("localDemoRequests", localDemoRequests);
		}
	}
    catch (err) { alert(err);}
}*/

function performSearch() {
    NavigatePage("#pgRedirect?url=#pgSearch");
}

function searchAction() {
    $("#divSearchResults").text("").append(getLoadingImg());

    userSearchDemoRequest = -1;

    var searchURL = serviceRootUrl + "svc.aspx?op=SearchDemoRequests&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&modality=All&strRequestID=" + userSearchDemoRequest + "&specialistLogin=" + userInfoData.CurrentSpecialist;

    Jsonp_Call(searchURL, false, "callbackPopulateSearchResults");
}

function callbackPopulateSearchResults(data) {
    try {
        $("#divSearchResults").text("");

        if (data.d.results.length > 0) {
            for (var i = 0; i < data.d.results.length; i++) {
                var demoRequest = data.d.results[i];
                var temp = "";
                temp += '<table class="search-item">';
                temp += '<tr>';
                temp += '<td class="catalog-info">';
                temp += '<div class="div-catalog-info">';
                temp += '<table width="100%" cellpadding="1" cellspacing="1">'
                temp += '<tr><td class="search-result-title">Customer:</td><td class="search-result-value" colspan="2">' + demoRequest.Customer + '</td></tr>';
                temp += '<tr><td class="search-result-title">Sales Rep:</td><td class="search-result-value">' + demoRequest.SalesRep + '</td>';
                temp += '<td rowspan="5" valign="bottom" align="right" width="80"><a data-mini="true" data-inline="true" data-role="button" href="javascript: addStatusAction(\'' + demoRequest.DemoRequestID.toString() + '\', \'' + demoRequest.StatusID.toString() + '\', \'' + demoRequest.SerialNumber.toString() + '\');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c" style="margin-right: 0px;"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Add<br />Status</span></span></a></td></tr>';
                temp += '<tr><td class="search-result-title">Demo Date:</td><td class="search-result-value">' + demoRequest.RequestedDate + '</td></tr>';
                temp += '<tr><td class="search-result-title">Demo System:</td><td class="search-result-value">' + demoRequest.DemoSystem + '</td></tr>';
                temp += '<tr><td class="search-result-title">System Serial #:</td><td class="search-result-value">' + demoRequest.SerialNumber + '</td></tr>';
                temp += '<tr><td class="search-result-title">Status:</td><td class="search-result-value">' + (demoRequest.StatusStatus == "Pending" ? "<span style='color:red;'>" + demoRequest.StatusStatus + "</span>" : "<span style='color:blue;'>" + demoRequest.StatusStatus + "</span>") + '</td></tr>';
                temp += '</table>'
                temp += '</div>';
                temp += '</td>';
                temp += '</tr>';
                temp += '</table>';

                $("#divSearchResults").append(temp);
            }

            $('.btnAddStatus').attr("data-theme", "a").removeClass("ui-btn-up-e").addClass("ui-btn-up-a");
        }
        else {
            //no item
            var temp = "<br /><center>No item found.</center>";
            $("#divSearchResults").text("").append(temp);
        }
    }
    catch (err) {
        $("#divSearchResults").text("").append("Internal application error.");
    }
}




/******************* History ***********************/
$(document).on("pagebeforeshow", "#pgHistory", function (event) {
    checkUserLogin();

    $("#divHistoryResults").text("").append(getLoadingImg());

    var _url = serviceRootUrl + "svc.aspx?op=GetHistoryStatuses&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&specialistLogin=" + userInfoData.CurrentSpecialist;
    Jsonp_Call(_url, false, "callbackPopulateHistories");
});

function callbackPopulateHistories(data) {
    try {
        if (data.d.results.length > 0) {
            $("#divHistoryResults").text("");

            for (var i = 0; i < data.d.results.length; i++) {
                var status = data.d.results[i];

                var temp = "";
                temp += '<table class="table-catalog-info">';
                temp += '<tr>';
                temp += '<td class="catalog-info">';
                temp += '<div class="col-xs-12 div-history-status-info history-collapsed itemid_' + status.ID + '">';
                temp += '<table width="100%" cellpadding="0" cellspacing="0"><tr><td onclick="toggleHistoryStatusDetails(this)"  valign="top">';
                temp += '<table width="100%" cellpadding="0" cellspacing="0">';
                temp += '<tr>';
                temp += '<td rowspan="20" class="collapsed-expanded-icon" valign="top" style="padding-top: 4px;"><div>&nbsp;</div></td>';
                temp += '<td class="history-head-title">Customer:</td><td class="history-head-value">' + status.Customer + '</td>';
                if (status.IsFinal == "No")
                    temp += "</td><td rowspan='20' width='40' align='right' valign='top' style='padding-top: 4px;'> <a href=''javascript:void(0);' onclick='NavigatePage(\"#pgAddStatus?sid=" + status.ID + "\")' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext'></a></td>";
                else
                    temp += "</td><td rowspan='20' width='40' align='right' valign='top' style='padding-top: 4px;'> <a href='javascript:void(0);' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext ui-disabled'></a></td>";
                temp += '</tr>';
                //temp += '<tr><td class="history-head-title">Demo Date:</td><td class="history-head-value">' + status.Customer + '</td></tr>';
                temp += '<tr><td class="history-head-title">System:</td><td class="history-head-value">' + status.SystemType + (status.SerialNumber != "" ? ' (' + status.SerialNumber + ')' : '') + '</td></tr>';
                temp += '<tr><td class="history-head-title">Reported:</td><td class="history-head-value">' + status.Modified + '</td></tr>';
                temp += '<tr><td class="history-head-title">Status:</td><td class="history-head-value">' + (status.IsFinal == "Yes" ? "<span style='color:green;'>Final</span>" : "<span style='color:red;'>Draft</span>") + '</td></tr>';

                //temp += '<td rowspan="2" class="collapsed-expanded-icon" valign="middle"><div>&nbsp;</div></td>';
                //temp += '<td valign="top"><span class="head-cat"><b>' + status.Modality + ' (' + status.SystemType + ')</b></span></td>';										
                //temp += '<td align="right">' + status.Modified + '</td></tr>';
                ////temp += '<tr><td valign="top">Serial #: ' + status.SerialNumber + '</td>';
                //temp += '<td align="right">Submission: <i>' + (status.IsFinal == "Yes" ? "<b>Final</b>" : "Draft") + '</i></td></tr>';
                temp += '</table>';

                temp += "</td></tr></table>";
                temp += '</div>  ';
                temp += '<div id="divHistoryStatusDetails">  ';
                temp += '<table width="100%">';
                temp += '<tr>';
                temp += '<td class="history-item-title" width="30%">Customer:</td>';
                temp += '<td class="history-item-value" width="70%">' + status.Customer + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title" width="30%">System Serial #:</td>';
                temp += '<td class="history-item-value" width="70%">' + status.SerialNumber + '</td>';
                temp += '</tr>';
                //temp += '<tr>';
                //	temp += '<td class="history-item-title">Software version:</td>';
                //	temp += '<td class="history-item-value">' + status.SoftwareVersion + '</td>';
                //temp += '</tr>';
                //temp += '<tr>';
                //	temp += '<td class="history-item-title">Revision Level:</td>';
                //	temp += '<td class="history-item-value">' + status.RevisionLevel + '</td>';
                //temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Date:</td>';
                temp += '<td class="history-item-value">' + status.SystemDate + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">CSS:</td>';
                temp += '<td class="history-item-value">' + status.MCSS + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Modality:</td>';
                temp += '<td class="history-item-value">' + status.Modality + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Comments:</td>';
                temp += '<td class="history-item-value" colspan="3">' + status.Comments + '</td>';
                temp += '</tr>';
                temp += '</table>';
                temp += '<br />';
                temp += '<table width="100%">';
                temp += '<tr>';
                temp += '<td class="history-item-section-header" colspan="4"><b>System condition on arrival</b></td>';
                temp += '</tr>';


                temp += '<tr>';
                temp += '<td class="history-item-title" width="50%">Physical State:</td>';
                temp += '<td class="history-item-value" width="50%">' + status.PhysicalState + '</td>';
                temp += '</tr>';
                if (status.PhysicalState != 'N/A') {
                    temp += '<tr ng-show="" style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += '<td class="history-item-value">' + status.PhysicalStateComments + '</td>';
                    temp += '</tr>';
                }


                temp += '<tr>';
                temp += '<td class="history-item-title" width="50%">Transducer State:</td>';
                temp += '<td class="history-item-value" width="50%">' + status.TransducerState + '</td>';
                temp += '</tr>';
                if (status.TransducerState != 'N/A') {
                    temp += '<tr ng-show="" style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += '<td class="history-item-value">' + status.TransducerStateComments + '</td>';
                    temp += '</tr>';
                }






                temp += '<tr>';
                temp += '<td class="history-item-title" width="50%">Control panel layout:</td>';
                temp += '<td class="history-item-value" width="50%">' + status.ControlPanelLayout + '</td>';
                temp += '</tr>';
                if (status.ControlPanelLayout == 'Control panel changed') {
                    temp += '<tr ng-show="" style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += '<td class="history-item-value">' + status.LayoutChangeExplain + '</td>';
                    temp += '</tr>';
                }







                temp += '<tr>';
                temp += '<td class="history-item-title">Modality work list empty:</td>';
                temp += '<td class="history-item-value">' + status.ModalityWorkListEmpty + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">All software loaded and functioning:</td>';
                temp += '<td class="history-item-value">' + status.AllSoftwareLoadedAndFunctioning + '</td>';
                temp += '</tr>';

                if (status.AllSoftwareLoadedAndFunctioning == 'No') {
                    temp += '<tr ng-show="" style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += '<td class="history-item-value">' + status.IfNoExplain + '</td>';
                    temp += '</tr>';
                }
                temp += '<tr>';
                temp += '<td class="history-item-title">NPD presets on system:</td>';
                temp += '<td class="history-item-value">' + status.NPDPresetsOnSystem + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">HDD free of patients studies:</td>';
                temp += '<td class="history-item-value">' + status.HDDFreeOfPatientStudies + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Demo images loaded on hard drive:</td>';
                temp += '<td class="history-item-value">' + status.DemoImagesLoadedOnHardDrive + '</td>';
                temp += '</tr>';


                temp += '<tr>';
                temp += '<td class="history-item-title">System delivered on time:</td>';
                temp += '<td class="history-item-value">' + status.SystemDeliveredOnTime + '</td>';
                temp += '</tr>';

                if (status.SystemDeliveredOnTime == 'No') {
                    temp += '<tr style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += ' <td class="history-item-value">' + status.SystemDeliveredOnTimeExplain + '</td>';
                    temp += '</tr>';
                }

                temp += '<tr>';
                temp += '<td class="history-item-title">System delivered professionally:</td>';
                temp += '<td class="history-item-value">' + status.SystemDeliveredProfessionally + '</td>';
                temp += '</tr>';

                if (status.SystemDeliveredProfessionally == 'No') {
                    temp += '<tr style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += ' <td class="history-item-value">' + status.SystemDeliveredProfessionallyExplain + '</td>';
                    temp += '</tr>';
                }





                temp += '<tr>';
                temp += '<td class="history-item-section-header" colspan="4"><b>Before leaving customer site</b></td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">System performed as expected:</td>';
                temp += '<td class="history-item-value">' + status.SystemPerformedAsExpected + '</td>';
                temp += '</tr>';

                if (status.SystemPerformedAsExpected == 'No') {
                    temp += '<tr style="font-style:italic;">';
                    temp += '<td class="history-item-title" style="padding-left: 40px;">Explained:</td>';
                    temp += ' <td class="history-item-value">' + status.SystemPerformedNotAsExpectedExplain + '</td>';
                    temp += '</tr>';
                }
                temp += '<tr>';
                temp += '<td class="history-item-title">Were any issues discovered with system during demo:</td>';
                temp += '<td class="history-item-value">' + status.AnyIssuesDuringDemo + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Was service contacted:</td>';
                temp += '<td class="history-item-value">' + status.wasServiceContacted + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Confirm modality work list removed from system:</td>';
                temp += '<td class="history-item-value">' + status.ConfirmModalityWorkListRemoved + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-title">Confirm system HDD emptied of all patient studies:</td>';
                temp += '<td class="history-item-value">' + status.ConfirmSystemHDDEmptied + '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-section-header" colspan="4"><b>Additional Comments</b></td>';
                temp += '</tr>';

                if (status.AdditionalComments != '') {
                    temp += '<tr>';
                    temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;">';
                    temp += '<div>' + status.AdditionalComments + '</div>';
                    temp += '</td>';
                    temp += '</tr>';
                }
                if (status.AdditionalComments == '') {
                    temp += '<tr>';
                    temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;">No comment found.</td>';
                    temp += '</tr>';
                }
                temp += '<tr>';
                temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;text-align:center;padding-top: 10px;padding-bottom: 10px;">';
                temp += '<textarea id="taAdditionalComment' + status.ID + '" rows="2" style="width: 100%"></textarea>';
                temp += '<div id="divAddCommentError' + status.ID + '" style="color:red;display:none;">* Comment cannot be empty</div>';
                temp += '<a id="btnAddComment_' + status.ID + '" data-mini="true" data-inline="true" data-role="button" href="javascript: saveAdditionalComment(' + status.ID + ');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Add Comment</span></span></a>';
                temp += '</td>';
                temp += '</tr>';
                temp += '<tr>';
                temp += '<td class="history-item-photo-section" data-status-id="' + status.ID + '" data-status-photos="' + status.Photos + '" colspan="2" style="font-weight:normal;text-align:center;padding-top: 10px;padding-bottom: 10px;">';
                temp += '</td>';
                temp += '</tr>';
                temp += '</table> ';
                temp += '</div> ';
                temp += '</td>';
                temp += '</tr>';
                temp += '</table>';
                temp += '<div class="divRowSeparator"></div>';


                $("#divHistoryResults").append(temp);
            }

            var _id = $.urlParam("id");
            if (_id != "" && parseInt(_id) > 0) {
                $("div.itemid_" + _id).removeClass("history-collapsed").addClass("history-expanded");
                $("div.itemid_" + _id).next().show();

                var tempobj = $("div.itemid_" + _id).closest("td.catalog-info").find(".history-item-photo-section");
                var tempstatusid = tempobj.attr("data-status-id");
                LoadingPhotos(tempobj, tempstatusid, false);
            }
        }
        else {
            $("#divHistoryResults").text("").append("<br /><center>No history found.</center>");
        }
    }
    catch (err) {
        $("#divHistoryResults").text("").append("Internal application error.");
    }
}

function toggleHistoryStatusDetails(obj) {
    if ($(obj).closest("div").hasClass("history-collapsed")) {
        $(obj).closest("div").removeClass("history-collapsed").addClass("history-expanded");
        $(obj).closest("div").next().show();

        var tempobj = $(obj).closest("td.catalog-info").find(".history-item-photo-section");
        var tempstatusid = tempobj.attr("data-status-id");
        LoadingPhotos(tempobj, tempstatusid, false);
    }
    else {
        $(obj).closest("div").removeClass("history-expanded").addClass("history-collapsed");
        $(obj).closest("div").next().hide();
    }
}

function saveAdditionalComment(id) {
    var comment = $("#taAdditionalComment" + id).val();

    $("#divAddCommentError" + id).hide();

    if (jQuery.trim(comment) != "") {
        $("#divAddCommentError" + id).text("").append(getLoadingMini()).show();

        var _url = serviceRootUrl + "svc.aspx?op=AddAdditionalComments&SPUrl=" + spwebRootUrl + SitePath + "&itemid=" + id + "&comment=" + comment + "&authInfo=" + userInfoData.AuthenticationHeader + "&WorkPhone=" + userInfoData.Phone;
        Jsonp_Call(_url, false, "callbackAddComment");
    }
    else {
        $("#divAddCommentError" + id).text("").append("* Comment cannot be empty").show();
    }
};

function callbackAddComment(data) {
    try {
        if (data.d.results.length > 0) {
            NavigatePage("#pgRedirect?url=" + encodeURIComponent("#pgHistory?id=" + data.d.results[0]));
        }
    }
    catch (err) { }
}


/******************* Add Status ***********************/
$(document).on("pagebeforeshow", "#pgAddStatus", function (event) {
    checkUserLogin();

    //clear the form
    $("table.table-add-status").find("input").each(function () {
        if ($(this).attr("type") == "text")
            $(this).val("");
        if ($(this).attr("type") == "radio") {
            $(this).checkboxradio();
            $(this).checkboxradio("refresh");
            $(this).filter('[checked=checked]').prop('checked', true);
        }
    });

    $(".add-picture-display").html("");

    $("table.table-add-status").find("input[type=radio]").checkboxradio("refresh");
    $("#allSoftwareLoadedAndFunctioningReasonTR").hide();
    $("#PhysicalStateCommentsTR").hide();
    $("#TransducerStateCommentsTR").hide();
    $("#LayoutChangeExplainTR").hide();
    $("#systemPerformedNotAsExpectedExplainTR").hide();

    $("#SystemDeliveredOnTimeExplainTR").hide();
    $("#SystemDeliveredProfessionallyExplainTR").hide();


    $("#selectModality").val('UL').selectmenu('refresh', true);
    $('#error-div2').text("");
    $('#Comments').val("");


    if ($.urlParam("id") == "") {
        $(".add-new-status").show();
        $(".add-status").hide();
        //$("#btnSubmitFinal").hide();

        var today = new Date();
        $("#catalog_System_x0020_Date").text((today.getMonth() + 1) + '/' + today.getDate() + '/' + today.getFullYear());
        $("#catalog_MCSS").text(GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));
    }
    else {
        $(".add-new-status").hide();
        $(".add-status").show();
        //$("#btnSubmitFinal").show();
    }

    if ($.urlParam("sid") != "") {
        $("#divStatusId").text($.urlParam("sid"));
        //$("#btnSubmitFinal").show();
    }
    else
        $("#divStatusId").text("");

    //$("#catalog_ScheduleID").hide();
    //$("#catalog_EquipmentRequestID").hide();

    $("#allSoftwareLoadedAndFunctioning1, #allSoftwareLoadedAndFunctioning2").change(function () {
        if ($(this).val() == "No")
            $("#allSoftwareLoadedAndFunctioningReasonTR").show();
        else
            $("#allSoftwareLoadedAndFunctioningReasonTR").hide();
    });
    $("#systemPerformedAsExpected1, #systemPerformedAsExpected2").change(function () {
        if ($(this).val() == "No")
            $("#systemPerformedNotAsExpectedExplainTR").show();
        else
            $("#systemPerformedNotAsExpectedExplainTR").hide();
    });

    $("#SystemDeliveredOnTime1, #SystemDeliveredOnTime2").change(function () {
        if ($(this).val() == "No")
            $("#SystemDeliveredOnTimeExplainTR").show();
        else
            $("#SystemDeliveredOnTimeExplainTR").hide();
    });

    $("#SystemDeliveredProfessionally1, #SystemDeliveredProfessionally2").change(function () {
        if ($(this).val() == "No")
            $("#SystemDeliveredProfessionallyExplainTR").show();
        else
            $("#SystemDeliveredProfessionallyExplainTR").hide();
    });


    $("#PhysicalState").change(function () {
        if ($(this).val() != "N/A")
            $("#PhysicalStateCommentsTR").show();
        else
            $("#PhysicalStateCommentsTR").hide();
    });


    $("#TransducerState").change(function () {
        if ($(this).val() != "N/A")
            $("#TransducerStateCommentsTR").show();
        else
            $("#TransducerStateCommentsTR").hide();
    });


    //Load PhysicalState from localstorage
    var lookupPhysicalStateValues = localstorage.get("lookupPhysicalStateValues");
    if (lookupPhysicalStateValues != null && lookupPhysicalStateValues != "") {
        $('#PhysicalState option[value!="N/A"]').remove();
        var _lookupPhysicalStateValues = lookupPhysicalStateValues.split(";");
        for (var i = 0; i < _lookupPhysicalStateValues.length; i++) {
            if (_lookupPhysicalStateValues[i] != "")
                $("#PhysicalState").append("<option value='" + _lookupPhysicalStateValues[i] + "'>" + _lookupPhysicalStateValues[i] + "</option>");
        }
        $("#PhysicalState").selectmenu('refresh', true);
    }

    var _url1 = serviceRootUrl + "svc.aspx?op=GetPhysicalStateValues&SPUrl=" + spwebRootUrl + SitePath;

    Jsonp_Call(_url1, false, "callbackGetPhysicalStateValues");

    //Load TransducerState from localstorage
    var lookupTransducerStateValues = localstorage.get("lookupTransducerStateValues");
    if (lookupTransducerStateValues != null && lookupTransducerStateValues != "") {
        $('#TransducerState option[value!="N/A"]').remove();
        var _lookupTransducerStateValues = lookupTransducerStateValues.split(";");
        for (var i = 0; i < _lookupTransducerStateValues.length; i++) {
            if (_lookupTransducerStateValues[i] != "")
                $("#TransducerState").append("<option value='" + _lookupTransducerStateValues[i] + "'>" + _lookupTransducerStateValues[i] + "</option>");
        }
        $("#TransducerState").selectmenu('refresh', true);
    }

    var _url1 = serviceRootUrl + "svc.aspx?op=GetTransducerStateValues&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetTransducerStateValues");


    $("#controlPanelLayout").change(function () {
        if ($(this).val() == "Control panel changed")
            $("#LayoutChangeExplainTR").show();
        else
            $("#LayoutChangeExplainTR").hide();
    });

    //Load CPL from localstorage
    var lookupCPLValues = localstorage.get("lookupCPLValues");
    if (lookupCPLValues != null && lookupCPLValues != "") {
        $('#controlPanelLayout option[value!="N/A"]').remove();
        var _lookupCPLValues = lookupCPLValues.split(";");
        for (var i = 0; i < _lookupCPLValues.length; i++) {
            if (_lookupCPLValues[i] != "")
                $("#controlPanelLayout").append("<option value='" + _lookupCPLValues[i] + "'>" + _lookupCPLValues[i] + "</option>");
        }
        $("#controlPanelLayout").selectmenu('refresh', true);
    }

    var _url1 = serviceRootUrl + "svc.aspx?op=GetCPLValues&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetCPLValues");

    //Populate the draft data
    if (isNumber($("#divStatusId").text())) {
        var _url = serviceRootUrl + "svc.aspx?op=GetHistoryStatusById&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $("#divStatusId").text();
        Jsonp_Call(_url, true, "callbackLoadDraftStatus");
    }


    var id = $.urlParam("id");
    if (id > 0) {
        //var _url2 = serviceRootUrl + "svc.aspx?op=GetCatalogById&SPUrl=" + spwebRootUrl +  SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&id=" + id;
        var _url2 = serviceRootUrl + "svc.aspx?op=GetDemoRequestById&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&id=" + id + "&serialNumber=" + $.urlParam("serial");

        Jsonp_Call(_url2, true, "callbackLoadAddStatus");
    }
    else {
        ///
    }
});

function callbackLoadAddStatus(data) {
    try {
        if (data.d.results.length > 0) {
            //var catalog = data.d.results[0];
            //$("#catalog_SystemType").text(catalog.SystemType);
            //$("#catalog_Product").text(catalog.Product);
            //$("#catalog_Software_x0020_Version").text(catalog.Software_x0020_Version);
            //$("#catalog_Revision_x0020_Level").text(catalog.Revision_x0020_Level);
            //$("#catalog_System_x0020_Date").text(catalog.System_x0020_Date.substring(0, catalog.System_x0020_Date.indexOf(" ")));
            //$("#catalog_MCSS").text(catalog.MCSS.substring(catalog.MCSS.indexOf("#") + 1));
            //$("#catalog_Modality").text(catalog.Modality);

            var demoRequest = data.d.results[0];

            $("#catalog_Customer").text(demoRequest.Customer);
            $("#inputCustomer").val(demoRequest.Customer);

            $("#catalog_SystemType").text(demoRequest.DemoSystem);
            $("#inputSystemType").val(demoRequest.DemoSystem);
            $("#catalog_System_x0020_Date").text(demoRequest.RequestedDate);
            $("#catalog_Modality").text("UL");
            $("#catalog_MCSS").text(GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));
            $("#catalog_Serial_x0020_Number").text(demoRequest.SerialNumber);
            //$("#catalog_ScheduleID").text(demoRequest.ScheduleID);
            //$("#catalog_EquipmentRequestID").text(demoRequest.EquipmentRequestID);

            $("#inputSystemSerialNumber").val(demoRequest.SerialNumber);
            $("#inputScheduleID").val(demoRequest.ScheduleID);
            $("#inputEquipmentRequestID").val(demoRequest.EquipmentRequestID);
            $("#inputDemoRequestID").val(demoRequest.DemoRequestID);

            $("#selectModality").val("UL").selectmenu('refresh', true);         
        }
        else {
            //
            $("#inputDemoRequestID").val("");
            $("#inputScheduleID").val("");
            $("#inputEquipmentRequestID").val("");
            $("#inputSystemSerialNumber").val("");
        }

        if ($("#inputSystemSerialNumber").val() == "")
            $(".add-new-status-serial-number").show();

        $(".add-picture-display").html("");

    }
    catch (err) { }
}



function callbackGetPhysicalStateValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#PhysicalState option[value!="N/A"]').remove();
            var lookupPhysicalStateValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#PhysicalState").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupPhysicalStateValues += data.d.results[i] + ";";
            }
            $("#PhysicalState").selectmenu('refresh', true);
            localstorage.set("lookupPhysicalStateValues", lookupPhysicalStateValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}

function callbackGetTransducerStateValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#TransducerState option[value!="N/A"]').remove();
            var lookupTransducerStateValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#TransducerState").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupTransducerStateValues += data.d.results[i] + ";";
            }
            $("#TransducerState").selectmenu('refresh', true);
            localstorage.set("lookupTransducerStateValues", lookupTransducerStateValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}



function callbackGetCPLValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#controlPanelLayout option[value!="N/A"]').remove();
            var lookupCPLValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#controlPanelLayout").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupCPLValues += data.d.results[i] + ";";
            }
            $("#controlPanelLayout").selectmenu('refresh', true);
            localstorage.set("lookupCPLValues", lookupCPLValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}

function callbackLoadDraftStatus(data) {
    try {
        if (data.d.results.length > 0) {
            var item = data.d.results[0];

            $("#inputCustomer").val(item.Customer);
            $("#inputSystemType").val(item.SystemType);
            $("#inputDemoRequestID").val(item.DemoRequestID);
            $("#inputSystemSerialNumber").val(item.SerialNumber);
            $("#inputScheduleID").val(item.ScheduleID);
            $("#inputEquipmentRequestID").val(item.EquipmentRequestID);
            //$("#inputSoftwareVersion").val(item.SoftwareVersion);
            //$("#inputRevisionLevel").val(item.RevisionLevel);
            $("#selectModality").val(item.Modality).selectmenu('refresh', true);

            $("#Comments").val(item.Comments);
            $("#PhysicalState").val(item.PhysicalState).selectmenu('refresh', true);
            $("#TransducerState").val(item.TransducerState).selectmenu('refresh', true);
            $("#controlPanelLayout").val(item.ControlPanelLayout).selectmenu('refresh', true);
            SetRadioValue('modalityWorkListEmpty', item.ModalityWorkListEmpty);
            SetRadioValue('allSoftwareLoadedAndFunctioning', item.AllSoftwareLoadedAndFunctioning);
            $("#allSoftwareLoadedAndFunctioningReason").val(item.IfNoExplain);
            SetRadioValue('nPDPresetsOnSystem', item.NPDPresetsOnSystem);
            SetRadioValue('hDDFreeOfPatientStudies', item.HDDFreeOfPatientStudies);
            SetRadioValue('demoImagesLoadedOnHardDrive', item.DemoImagesLoadedOnHardDrive);
            SetRadioValue('systemPerformedAsExpected', item.SystemPerformedAsExpected);
            $("#systemPerformedNotAsExpectedExplain").val(item.SystemPerformedNotAsExpectedExplain);


            SetRadioValue('SystemDeliveredOnTime', item.SystemDeliveredOnTime);
            $("#SystemDeliveredOnTimeExplain").val(item.SystemDeliveredOnTimeExplain);
            SetRadioValue('SystemDeliveredProfessionally', item.SystemDeliveredProfessionally);
            $("#SystemDeliveredProfessionallyExplain").val(item.SystemDeliveredProfessionallyExplain);


            SetRadioValue('wereAnyIssuesDiscoveredWithSystemDuringDemo', item.AnyIssuesDuringDemo);
            SetRadioValue('wasServiceContacted', item.wasServiceContacted);
            SetRadioValue('ConfirmSystemHddEmptiedOfAllPatientStudies', item.ConfirmModalityWorkListRemoved);
            SetRadioValue('ConfirmModalityWorkListRemovedFromSystem', item.ConfirmSystemHDDEmptied);
            $("#PhysicalStateComments").val(item.PhysicalStateComments);
            $("#TransducerStateComments").val(item.TransducerStateComments);
            $("#LayoutChangeExplain").val(item.LayoutChangeExplain);

            $("table.table-add-status").find("input[type=radio]").checkboxradio("refresh");

            if ($('input[name=allSoftwareLoadedAndFunctioning]:checked').val() == "No")
                $("#allSoftwareLoadedAndFunctioningReasonTR").show();
            else
                $("#allSoftwareLoadedAndFunctioningReasonTR").hide();

            if ($('input[name=systemPerformedAsExpected]:checked').val() == "No")
                $("#systemPerformedNotAsExpectedExplainTR").show();
            else
                $("#systemPerformedNotAsExpectedExplainTR").hide();

            if ($('input[name=SystemDeliveredOnTime]:checked').val() == "No")
                $("#SystemDeliveredOnTimeExplainTR").show();
            else
                $("#SystemDeliveredOnTimeExplainTR").hide();

            if ($('input[name=SystemDeliveredProfessionally]:checked').val() == "No")
                $("#SystemDeliveredProfessionallyExplainTR").show();
            else
                $("#SystemDeliveredProfessionallyExplainTR").hide();




            if ($("#PhysicalState").val() != "N/A")
                $("#PhysicalStateCommentsTR").show();
            else
                $("#PhysicalStateCommentsTR").hide();

            if ($("#TransducerState").val() != "N/A")
                $("#TransducerStateCommentsTR").show();
            else
                $("#TransducerStateCommentsTR").hide();


            if ($("#controlPanelLayout").val() == "Control panel changed")
                $("#LayoutChangeExplainTR").show();
            else
                $("#LayoutChangeExplainTR").hide();

            $(".add-picture-display").html("");
            if (item.Photos != "") {
                $(".add-picture-display").attr("data-status-photos", item.Photos);
                LoadingPhotos($(".add-picture-display"), item.ID, true);
            }
        }
        else {
            //
            $(".add-picture-display").html("");
            $("#inputDemoRequestID").val("");
            $("#inputScheduleID").val("");
            $("#inputEquipmentRequestID").val("");
            $("#inputSystemSerialNumber").val("");
        }

    }
    catch (err) { }
}


function cancelStatus() {
    $('<div>').simpledialog2({
        mode: 'blank',
        headerText: 'Confirmation',
        headerClose: false,
        transition: 'flip',
        themeDialog: 'a',
        zindex: 2000,
        blankContent:
		  "<div style='padding: 15px;'><p>Cancel the status update and go back to main screen?</p>" +
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"NavigatePage('#pgHome');\">OK</a></td>" +
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
}

function saveStatus(isFinal) {
    $scope = {
        //recordId : $.urlParam("id"),
        //demoRequestID: $.urlParam("id"),
        demoRequestID: $("#inputDemoRequestID").val(),
        Comments: $("#Comments").val(),
        PhysicalState: $("#PhysicalState").val(),
        TransducerState: $("#TransducerState").val(),
        controlPanelLayout: $("#controlPanelLayout").val(),
        modalityWorkListEmpty: $('input[name=modalityWorkListEmpty]:checked').val(),
        allSoftwareLoadedAndFunctioning: $('input[name=allSoftwareLoadedAndFunctioning]:checked').val(),
        allSoftwareLoadedAndFunctioningReason: $("#allSoftwareLoadedAndFunctioningReason").val(),
        nPDPresetsOnSystem: $('input[name=nPDPresetsOnSystem]:checked').val(),
        hDDFreeOfPatientStudies: $('input[name=hDDFreeOfPatientStudies]:checked').val(),
        demoImagesLoadedOnHardDrive: $('input[name=demoImagesLoadedOnHardDrive]:checked').val(),
        systemPerformedAsExpected: $('input[name=systemPerformedAsExpected]:checked').val(),
        systemPerformedNotAsExpectedExplain: $("#systemPerformedNotAsExpectedExplain").val(),

        SystemDeliveredOnTime: $('input[name=SystemDeliveredOnTime]:checked').val(),
        SystemDeliveredOnTimeExplain: $("#SystemDeliveredOnTimeExplain").val(),
        SystemDeliveredProfessionally: $('input[name=SystemDeliveredProfessionally]:checked').val(),
        SystemDeliveredProfessionallyExplain: $("#SystemDeliveredProfessionallyExplain").val(),

        wereAnyIssuesDiscoveredWithSystemDuringDemo: $('input[name=wereAnyIssuesDiscoveredWithSystemDuringDemo]:checked').val(),
        wasServiceContacted: $('input[name=wasServiceContacted]:checked').val(),
        ConfirmSystemHddEmptiedOfAllPatientStudies: $('input[name=ConfirmSystemHddEmptiedOfAllPatientStudies]:checked').val(),
        ConfirmModalityWorkListRemovedFromSystem: $('input[name=ConfirmModalityWorkListRemovedFromSystem]:checked').val(),
        PhysicalStateComments: $("#PhysicalStateComments").val(),
        TransducerStateComments: $("#TransducerStateComments").val(),
        LayoutChangeExplain: $("#LayoutChangeExplain").val(),
        userInfo: { WorkPhone: userInfoData.Phone },

        Customer: $("#inputCustomer").val(),
        SystemType: $("#inputSystemType").val(),
        SystemSerialNumber: $("#inputSystemSerialNumber").val(),
        ScheduleID: $("#inputScheduleID").val(),
        EquipmentRequestID: $("#inputEquipmentRequestID").val(),
        //SoftwareVersion : $("#inputSoftwareVersion").val(),
        //RevisionLevel : $("#inputRevisionLevel").val(),
        Modality: $("#selectModality").val(),
        StatusId: $("#divStatusId").text()
    };


    //if ($scope.recordId == "" || !($scope.recordId > 0)) {
    //if ($scope.demoRequestID == "" || !($scope.demoRequestID > 0)) {
    if ((isFinal == "Yes") && ($scope.SystemType == "" || $scope.SystemSerialNumber == "" || $scope.SoftwareVersion == "" || $scope.Modality == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }
    //}


    if ((isFinal == "Yes") && ($scope.PhysicalState == "" || $scope.TransducerState == "" || $scope.controlPanelLayout == "" || $scope.modalityWorkListEmpty == "" || $scope.allSoftwareLoadedAndFunctioning == "" || $scope.nPDPresetsOnSystem == "" || $scope.hDDFreeOfPatientStudies == "" || $scope.demoImagesLoadedOnHardDrive == "" || $scope.systemPerformedAsExpected == "" || $scope.systemPerformedAsExpected == "" || $scope.SystemDeliveredProfessionally == "" || $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "" || $scope.ConfirmSystemHddEmptiedOfAllPatientStudies == "" || $scope.ConfirmModalityWorkListRemovedFromSystem == "")) {
        $('#error-div').html('Please select all values.');
        showTimedElem('error-div');
        $('#error-div2').html('Please select all values.');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }

    if ((isFinal == "Yes") && ($scope.systemPerformedAsExpected == "No" && $scope.systemPerformedNotAsExpectedExplain == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }
    if ((isFinal == "Yes") && ($scope.SystemDeliveredOnTime == "No" && $scope.SystemDeliveredOnTimeExplain == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }
    if ((isFinal == "Yes") && ($scope.SystemDeliveredProfessionally == "No" && $scope.SystemDeliveredProfessionallyExplain == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }


    if ((isFinal == "Yes") && ($scope.PhysicalState != "N/A" && $scope.PhysicalStateComments == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }

    if ((isFinal == "Yes") && ($scope.TransducerState != "N/A" && $scope.TransducerStateComments == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }

    if ((isFinal == "Yes") && ($scope.controlPanelLayout == "Control panel changed" && $scope.LayoutChangeExplain == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }

    if ((isFinal == "Yes") && ($scope.allSoftwareLoadedAndFunctioning == "No" && $scope.allSoftwareLoadedAndFunctioningReason == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }

    if ((isFinal == "Yes") && ($scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "Yes" && $scope.wasServiceContacted == "")) {
        $('#error-div').html('Please fill all values marked "*".');
        showTimedElem('error-div');
        $('#error-div2').html('Please fill all values marked "*".');
        showTimedElem('error-div2');
        //showLoading(false);
        return;
    }


    var confirmMessage = 'Do you want to save <b><u>draft</u></b>?<br />You can come back and edit it later';
    if (isFinal == "Yes")
        confirmMessage = 'Do you want to submit a <b><u>final</u></b> status?<br />The status will become read-only';

    //var sure = confirm(confirmMessage);

    $('<div>').simpledialog2({
        mode: 'blank',
        headerText: 'Confirmation',
        headerClose: false,
        transition: 'flip',
        themeDialog: 'a',
        width: 300,
        zindex: 2000,
        blankContent:
            "<div style='padding: 15px;'><p>" + confirmMessage + "</p>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveStatusProcess('" + isFinal + "');\">OK</a></td>" +
            "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
}


function SaveStatusProcess(isFinal) {
    if ($scope) {

        //show saving animation
        $('#error-div2').text("").append(getLoadingMini());
        showTimedElem('error-div2');

        if ($scope.demoRequestID != "" && parseInt($scope.demoRequestID) > 0)
            //if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
        {
            //showLoading(true);
            //var _url =  serviceRootUrl + "svc.aspx?op=AddStatus&SPUrl=" + spwebRootUrl +  SitePath + "&recordId=" + $scope.recordId + "&PhysicalStateComments=" + $scope.PhysicalStateComments+ "&TransducerStateComments=" + $scope.TransducerStateComments+"&PhysicalState=" + $scope.PhysicalState+ "&TransducerState=" + $scope.TransducerState+ "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
            //var _url = serviceRootUrl + "svc.aspx?op=AddStatus&SPUrl=" + spwebRootUrl + SitePath + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&PhysicalStateComments=" + $scope.PhysicalStateComments + "&TransducerStateComments=" + $scope.TransducerStateComments + "&PhysicalState=" + $scope.PhysicalState + "&TransducerState=" + $scope.TransducerState + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
            var _url = serviceRootUrl + "svc.aspx?op=AddStatus&SPUrl=" + spwebRootUrl + SitePath + "&Customer=" + $scope.Customer + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&PhysicalStateComments=" + $scope.PhysicalStateComments + "&TransducerStateComments=" + $scope.TransducerStateComments + "&PhysicalState=" + $scope.PhysicalState + "&TransducerState=" + $scope.TransducerState + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId + "&DemoRequestID=" + $scope.demoRequestID + "&ScheduleID=" + $scope.ScheduleID + "&EquipmentRequestID=" + $scope.EquipmentRequestID + "&SerialNumber=" + $scope.SystemSerialNumber + "&mcss=" + userInfoData.CurrentSpecialist;
            Jsonp_Call(_url, true, "callbackSaveStatus");
        }
        else {
            //var _url =  serviceRootUrl + "svc.aspx?op=AddNewStatus&SPUrl=" + spwebRootUrl + SitePath + "&SerialNumber=" + $scope.SystemSerialNumber + "&SoftwareVersion=" + $scope.SoftwareVersion + "&RevisionLevel=" + $scope.RevisionLevel + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&PhysicalStateComments=" + $scope.PhysicalStateComments+ "&TransducerStateComments=" + $scope.TransducerStateComments+"&PhysicalState=" + $scope.PhysicalState+ "&TransducerState=" + $scope.TransducerState+"&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
            //var _url = serviceRootUrl + "svc.aspx?op=AddNewStatus&SPUrl=" + spwebRootUrl + SitePath + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&PhysicalStateComments=" + $scope.PhysicalStateComments + "&TransducerStateComments=" + $scope.TransducerStateComments + "&PhysicalState=" + $scope.PhysicalState + "&TransducerState=" + $scope.TransducerState + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
            var _url = serviceRootUrl + "svc.aspx?op=AddNewStatus&SPUrl=" + spwebRootUrl + SitePath + "&SerialNumber=" + $scope.SystemSerialNumber + "&Customer=" + $scope.Customer + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&PhysicalStateComments=" + $scope.PhysicalStateComments + "&TransducerStateComments=" + $scope.TransducerStateComments + "&PhysicalState=" + $scope.PhysicalState + "&TransducerState=" + $scope.TransducerState + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&SystemDeliveredOnTimeExplain=" + $scope.SystemDeliveredOnTimeExplain + "&SystemDeliveredProfessionallyExplain=" + $scope.SystemDeliveredProfessionallyExplain + "&SystemDeliveredOnTime=" + $scope.SystemDeliveredOnTime + "&SystemDeliveredProfessionally=" + $scope.SystemDeliveredProfessionally + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId + "&DemoRequestID=" + $scope.demoRequestID + "&ScheduleID=" + $scope.ScheduleID + "&EquipmentRequestID=" + $scope.EquipmentRequestID + "&mcss=" + userInfoData.CurrentSpecialist;

            Jsonp_Call(_url, true, "callbackSaveStatus");
        }
    }
}

var photosToUpload = [];
function callbackSaveStatus(data) {
    try {

        if (data.d.results.length > 0 && parseInt(data.d.results[0]) > 0) {
            var statusID = parseInt(data.d.results[0]);
            photosToUpload = [];
            $(".add-picture-display").find("img").each(function (index) {
                if ($(this).attr("data-id") == "") {
                    photosToUpload.push($(this));
                }
            });

            if (DeletingPhotos.length > 0)
                processPhotoDelete(statusID);
            else if (photosToUpload.length > 0)
                processPhotoUpload(statusID, photosToUpload.shift());
            else {
                //NavigatePage('#pgHistory');
                SendEmailNotification(statusID);
            }
        }
        else {
            //alert(data);
        }
    }
    catch (err) { }
}

function processPhotoUpload(statusID, imageObj) {
    var url = serviceRootUrl + "photo.ashx?op=UploadPhoto&statusid=" + statusID + "&authinfo=" + userInfoData.AuthenticationHeader + "&spurl=" + spwebRootUrl + SitePath + "&filename=" + imageObj.attr("data-name").replace("XIDX", statusID);
    var imageData = imageObj.attr("src").replace(/^data:image\/(png|jpg|jpeg);base64,/ig, "");
    var params = { image: imageData };

    $.post(url, params, function (data) {
        //alert('sent');
        if (photosToUpload.length > 0)
            processPhotoUpload(statusID, photosToUpload.shift());
        else {
            //NavigatePage('#pgHistory');
            SendEmailNotification(statusID);
        }
    });
}

function processPhotoDelete(statusID) {
    var url = serviceRootUrl + "photo.ashx?op=DeletePhotos&statusid=" + statusID + "&authinfo=" + userInfoData.AuthenticationHeader + "&spurl=" + spwebRootUrl + SitePath + "&ids=" + DeletingPhotos.join(";");
    var params = { };
    $.post(url, params, function (data) {
        //alert('sent');
        if (photosToUpload.length > 0)
            processPhotoUpload(statusID, photosToUpload.shift());
        else {
            //NavigatePage('#pgHistory');
            SendEmailNotification(statusID);
        }
    });
}


function SendEmailNotification(statusID) {
    var _url = serviceRootUrl + "svc.aspx?op=SendNotification&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + statusID;
    Jsonp_Call(_url, true, "callbackSendEmailNotification");
}


function callbackSendEmailNotification(data) {
    NavigatePage('#pgHistory');
}










/******************* Send Feedback ***********************/
$(document).on("pagebeforeshow", "#pgSendFeedback", function (event) {
    checkUserLogin();

    //clear the form
    $("table.table-add-status").find("input").each(function () {
        if ($(this).attr("type") == "text")
            $(this).val("");

        if ($(this).attr("type") == "date")
            $(this).val(NowDate());


        if ($(this).attr("type") == "radio")
            $(this).filter('[value=No]').prop('checked', true);
    });


    $("#tbl_SF").find("input[type=radio]").checkboxradio("refresh");

    $('#SendFeedback-error-div').text("");
    $('#SendFeedback-error-div2').text("");
    $('#txt_SF_Comments').val("");
    $('#txt_SF_Ergonomics').val("");

    $(".add-status").show();
    $(".add-new-status").show();

    $("#tr_SF_ProductGap").hide();
    $("#tr_SF_PortfolioGap").hide();
    $("#tr_SF_ClinicalApps").hide();
    $("#tr_SF_Workflow").hide();

    $("#txt_SF_SystemsLost").val("");
    $("#txt_SF_QuotedSystem").val("");
    $("#txt_SF_CompetitorWon").val("");
    $("#tr_SF_SystemsLost").hide();
    $("#tr_SF_QuotedSystem").hide();
    $("#tr_SF_CompetitorWon").hide();

    //$("#txt_SF_catalog_MCSS").text(userInfoData.DisplayName);
    $("#txt_SF_catalog_MCSS").val(GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));

    $("#ddl_SF_ProductGap").change(function () {
        if ($(this).val() == "Other Feature")
        { $("#tr_SF_ProductGap").show(); }
        else
        { $("#txt_SF_ProductGap").val(""); $("#tr_SF_ProductGap").hide(); }
    });

    $("#ddl_SF_PortfolioGap").change(function () {
        if ($(this).val() == "Other Product")
        { $("#tr_SF_PortfolioGap").show(); }
        else
        { $("#txt_SF_PortfolioGap").val(""); $("#tr_SF_PortfolioGap").hide(); }
    });

    $("#ddl_SF_ClinicalApps").change(function () {
        if ($(this).val().indexOf(" - Other") >= 0)
        { $("#tr_SF_ClinicalApps").show(); }
        else
        { $("#txt_SF_ClinicalApps").val(""); $("#tr_SF_ClinicalApps").hide(); }
    });

    $("#ddl_SF_Workflow").change(function () {
        if ($(this).val() == "Other")
        { $("#tr_SF_Workflow").show(); }
        else
        { $("#txt_SF_Workflow").val(""); $("#tr_SF_Workflow").hide(); }
    });

    $("#rad_SF_GapCauseLostOrder1, #rad_SF_GapCauseLostOrder2").change(function () {
        if ($(this).val() == "Yes") {
            $("#tr_SF_SystemsLost").show();
            $("#tr_SF_QuotedSystem").show();
            $("#tr_SF_CompetitorWon").show();

        }
        else {
            $("#txt_SF_SystemsLost").val("");
            $("#txt_SF_QuotedSystem").val("");
            $("#txt_SF_CompetitorWon").val("");
            $("#tr_SF_SystemsLost").hide();
            $("#tr_SF_QuotedSystem").hide();
            $("#tr_SF_CompetitorWon").hide();
        }
    });





    //Load PG from localstorage
    var lookupPGValues = localstorage.get("lookupPGValues");
    if (lookupPGValues != null && lookupPGValues != "") {
        $('#ddl_SF_ProductGap option[value!="N/A"]').remove();
        var _lookupPGValues = lookupPGValues.split(";");
        for (var i = 0; i < _lookupPGValues.length; i++) {
            if (_lookupPGValues[i] != "")
                $("#ddl_SF_ProductGap").append("<option value='" + _lookupPGValues[i] + "'>" + _lookupPGValues[i] + "</option>");
        }
        $("#ddl_SF_ProductGap").selectmenu('refresh', true);
    }

    var _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=Product Gap&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetPGValues");

    var lookupFeedbackPortfolioGapValues = localstorage.get("lookupFeedbackPortfolioGapValues");
    if (lookupFeedbackPortfolioGapValues != null && lookupFeedbackPortfolioGapValues != "") {
        $('#ddl_SF_PortfolioGap option[value!="N/A"]').remove();
        var _lookupFeedbackPortfolioGapValues = lookupFeedbackPortfolioGapValues.split(";");
        for (var i = 0; i < _lookupFeedbackPortfolioGapValues.length; i++) {
            if (_lookupFeedbackPortfolioGapValues[i] != "")
                $("#ddl_SF_PortfolioGap").append("<option value='" + _lookupFeedbackPortfolioGapValues[i] + "'>" + _lookupFeedbackPortfolioGapValues[i] + "</option>");
        }
        $("#ddl_SF_PortfolioGap").selectmenu('refresh', true);
    }

    _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=Portfolio Gap&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetFeedbackPortfolioGapValues");

    var lookupFeedbackClinicalAppsValues = localstorage.get("lookupFeedbackClinicalAppsValues");
    if (lookupFeedbackClinicalAppsValues != null && lookupFeedbackClinicalAppsValues != "") {
        $('#ddl_SF_ClinicalApps option[value!="N/A"]').remove();
        var _lookupFeedbackClinicalAppsValues = lookupFeedbackClinicalAppsValues.split(";");
        for (var i = 0; i < _lookupFeedbackClinicalAppsValues.length; i++) {
            if (_lookupFeedbackClinicalAppsValues[i] != "")
                $("#ddl_SF_ClinicalApps").append("<option value='" + _lookupFeedbackClinicalAppsValues[i] + "'>" + _lookupFeedbackClinicalAppsValues[i] + "</option>");
        }
        $("#ddl_SF_ClinicalApps").selectmenu('refresh', true);
    }

    _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=Clinical Applications&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetFeedbackClinicalAppsValues");

    var lookupFeedbackWorkflowValues = localstorage.get("lookupFeedbackWorkflowValues");
    if (lookupFeedbackWorkflowValues != null && lookupFeedbackWorkflowValues != "") {
        $('#ddl_SF_Workflow option[value!="N/A"]').remove();
        var _lookupFeedbackWorkflowValues = lookupFeedbackWorkflowValues.split(";");
        for (var i = 0; i < _lookupFeedbackWorkflowValues.length; i++) {
            if (_lookupFeedbackWorkflowValues[i] != "")
                $("#ddl_SF_Workflow").append("<option value='" + _lookupFeedbackWorkflowValues[i] + "'>" + _lookupFeedbackWorkflowValues[i] + "</option>");
        }
        $("#ddl_SF_Workflow").selectmenu('refresh', true);
    }

    _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=Workflow&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetFeedbackWorkflowValues");

    _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=Clinical Applications&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetFeedbackClinicalAppsValues");

    var lookupFeedbackProductNameValues = localstorage.get("lookupFeedbackProductNameValues");
    if (lookupFeedbackProductNameValues != null && lookupFeedbackProductNameValues != "") {
        $('#ddl_SF_ProductName option[value!="N/A"]').remove();
        var _lookupFeedbackProductNameValues = lookupFeedbackProductNameValues.split(";");
        for (var i = 0; i < _lookupFeedbackProductNameValues.length; i++) {
            if (_lookupFeedbackProductNameValues[i] != "")
                $("#ddl_SF_ProductName").append("<option value='" + _lookupFeedbackProductNameValues[i] + "'>" + _lookupFeedbackProductNameValues[i] + "</option>");
        }
        $("#ddl_SF_ProductName").selectmenu('refresh', true);
    }

    _url1 = serviceRootUrl + "svc.aspx?op=GetPGValues&Type=ProductName&SPUrl=" + spwebRootUrl + SitePath;
    Jsonp_Call(_url1, false, "callbackGetFeedbackProductNameValues");

});

function callbackGetPGValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#ddl_SF_ProductGap option[value!="N/A"]').remove();
            var lookupPGValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#ddl_SF_ProductGap").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupPGValues += data.d.results[i] + ";";
            }
            $("#ddl_SF_ProductGap").selectmenu('refresh', true);
            localstorage.set("lookupPGValues", lookupPGValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}

function callbackGetFeedbackPortfolioGapValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#ddl_SF_PortfolioGap option[value!="N/A"]').remove();
            var lookupFeedbackPortfolioGapValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#ddl_SF_PortfolioGap").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupFeedbackPortfolioGapValues += data.d.results[i] + ";";
            }
            $("#ddl_SF_PortfolioGap").selectmenu('refresh', true);
            localstorage.set("lookupFeedbackPortfolioGapValues", lookupFeedbackPortfolioGapValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}

function callbackGetFeedbackClinicalAppsValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#ddl_SF_ClinicalApps option[value!="N/A"]').remove();
            var lookupFeedbackClinicalAppsValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#ddl_SF_ClinicalApps").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupFeedbackClinicalAppsValues += data.d.results[i] + ";";
            }
            $("#ddl_SF_ClinicalApps").selectmenu('refresh', true);
            localstorage.set("lookupFeedbackClinicalAppsValues", lookupFeedbackClinicalAppsValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}


function callbackGetFeedbackWorkflowValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#ddl_SF_Workflow option[value!="N/A"]').remove();
            var lookupFeedbackWorkflowValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#ddl_SF_Workflow").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupFeedbackWorkflowValues += data.d.results[i] + ";";
            }
            $("#ddl_SF_Workflow").selectmenu('refresh', true);
            localstorage.set("lookupFeedbackWorkflowValues", lookupFeedbackWorkflowValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}

function callbackGetFeedbackProductNameValues(data) {
    try {
        if (data.d.results.length > 0) {
            $('#ddl_SF_ProductName option[value!="N/A"]').remove();
            var lookupFeedbackProductNameValues = "";
            for (var i = 0; i < data.d.results.length; i++) {
                $("#ddl_SF_ProductName").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
                lookupFeedbackProductNameValues += data.d.results[i] + ";";
            }
            $("#ddl_SF_ProductName").selectmenu('refresh', true);
            localstorage.set("lookupFeedbackProductNameValues", lookupFeedbackProductNameValues);
        }
        else {
            //
        }
    }
    catch (err) { }
}


function cancelFeedback() {
    $('<div>').simpledialog2({
        mode: 'blank',
        headerText: 'Confirmation',
        headerClose: false,
        transition: 'flip',
        themeDialog: 'a',
        zindex: 2000,
        blankContent:
		  "<div style='padding: 15px;'><p>Cancel the feedback and go back to main screen?</p>" +
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"NavigatePage('#pgHome');\">OK</a></td>" +
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
}

function saveFeedback(isFinal) {

    $scope = {

        Comments: $("#txt_SF_Comments").val(),
        ProductGap: $("#ddl_SF_ProductGap").val(),
        ProductGapOther: $('#txt_SF_ProductGap').val(),
        PortfolioGapOther: $('#txt_SF_PortfolioGap').val(),
        ClinicalAppsOther: $('#txt_SF_ClinicalApps').val(),
        WorkflowOther: $('#txt_SF_Workflow').val(),
        HospitalName: $('#txt_SF_HospitalName').val(),
        DemoDate: $('#txt_SF_Date').val(),
        CSSName: $('#txt_SF_catalog_MCSS').val(),

        CustomerName: $("#txt_SF_CustomerName").val(),
        CustomerEmail: $("#txt_SF_CustomerEmail").val(),
        ProductName: $('#ddl_SF_ProductName').val(),
        SoftwareVersion: $('#txt_SF_SoftwareVersion').val(),
        PortfolioGap: $('#ddl_SF_PortfolioGap').val(),


        ClinicalApps: $("#ddl_SF_ClinicalApps").val(),
        Workflow: $("#ddl_SF_Workflow").val(),
        Ergonomics: $('#txt_SF_Ergonomics').val(),

        GapCauseLostOrder: $('input[name=rad_SF_GapCauseLostOrder]:checked').val(),
        SystemsLost: $('#txt_SF_SystemsLost').val(),
        QuotedSystem: $('#txt_SF_QuotedSystem').val(),
        CompetitorWon: $('#txt_SF_CompetitorWon').val(),



        userInfo: { WorkPhone: userInfoData.Phone },

    };



    if ($scope.CustomerName == "" || $scope.CustomerEmail == "" || $scope.SoftwareVersion == "" || $scope.ProductName == "" || $scope.HospitalName == "" || $scope.DemoDate == "" || $scope.CSSName == "") {
        $('#SendFeedback-error-div').html('Please fill all values marked "*".');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please fill all values marked "*".');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }


    if (!IsEmail($scope.CustomerEmail)) {
        $('#SendFeedback-error-div').html('Please enter a valid email address.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter a valid email address.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }



    if ($scope.ProductGap == "Other Feature" && $scope.ProductGapOther == "") {
        $('#SendFeedback-error-div').html('Please enter other value for Product Gap.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter other value for Product Gap.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }

    if ($scope.PortfolioGap == "Other Product" && $scope.PortfolioGapOther == "") {
        $('#SendFeedback-error-div').html('Please enter other value for Portfolio Gap.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter other value for Portfolio Gap.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }

    if ($scope.ClinicalApps.indexOf(" - Other") >= 0 && $scope.ClinicalAppsOther == "") {
        $('#SendFeedback-error-div').html('Please enter other value for Clinical Applications.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter other value for Clinical Applications.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }


    if ($scope.Workflow == "Other" && $scope.WorkflowOther == "") {
        $('#SendFeedback-error-div').html('Please enter other value for Workflow.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter other value for Workflow.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }





    if ($scope.GapCauseLostOrder == "Yes" && $scope.SystemsLost == "") {
        $('#SendFeedback-error-div').html('Please enter # of Systems Lost.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter # of Systems Lost.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }

    if ($scope.GapCauseLostOrder == "Yes" && $scope.QuotedSystem == "") {
        $('#SendFeedback-error-div').html('Please enter Quoted System.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter Quoted System.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }

    if ($scope.GapCauseLostOrder == "Yes" && $scope.CompetitorWon == "") {
        $('#SendFeedback-error-div').html('Please enter which Competitor Won.');
        showTimedElem('SendFeedback-error-div');
        $('#SendFeedback-error-div2').html('Please enter which Competitor Won.');
        showTimedElem('SendFeedback-error-div2');
        //showLoading(false);
        return;
    }





    var confirmMessage = 'Please confirm you want to send the Feedback. A confirmation email will be sent out to the customer email address.';

    $('<div>').simpledialog2({
        mode: 'blank',
        headerText: 'Confirmation',
        headerClose: false,
        transition: 'flip',
        themeDialog: 'a',
        width: 300,
        zindex: 2000,
        blankContent:
		  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>" +
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveFeedbackProcess('" + isFinal + "');\">OK</a></td>" +
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
}

function SaveFeedbackProcess(isFinal) {
    if ($scope) {

        //show saving animation
        $('#SendFeedback-error-div2').text("").append(getLoadingMini());
        showTimedElem('SendFeedback-error-div2');


        var _url = serviceRootUrl + "svc.aspx?op=SendFeedback&SPUrl=" + spwebRootUrl + MKTSitePath + "&HospitalName=" + $scope.HospitalName + "&ProductGap=" + $scope.ProductGap + "&ProductGapOther=" + $scope.ProductGapOther + "&CSSName=" + $scope.CSSName + "&CustomerName=" + $scope.CustomerName + "&CustomerEmail=" + $scope.CustomerEmail + "&ProductName=" + $scope.ProductName + "&SoftwareVersion=" + $scope.SoftwareVersion + "&PortfolioGap=" + $scope.PortfolioGap + "&PortfolioGapOther=" + $scope.PortfolioGapOther + "&ClinicalApplications=" + $scope.ClinicalApps + "&ClinicalApplicationsOther=" + $scope.ClinicalAppsOther + "&Workflow=" + $scope.Workflow + "&WorkflowOther=" + $scope.WorkflowOther + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&Ergonomics=" + $scope.Ergonomics + "&GapCauseLostOrder=" + $scope.GapCauseLostOrder + "&SystemsLost=" + $scope.SystemsLost + "&QuotedSystem=" + $scope.QuotedSystem + "&CompetitorWon=" + $scope.CompetitorWon + "&DemoDate=" + $scope.DemoDate + "&authInfo=" + userInfoData.AuthenticationHeader;

        Jsonp_Call(_url, true, "callbackSaveFeedback");


    }
}

function callbackSaveFeedback(data) {
    try {
        if (data.d.results.length > 0 && parseInt(data.d.results[0]) > 0) {
            NavigatePage('#pgHome');
        }
        else {
            //
        }
    }
    catch (err) { }
}


/******************* Redirect Page ***********************/
$(document).on("pagebeforeshow", "#pgRedirect", function (event) {
    if ($.urlParamRedirect("url")) {
        NavigatePage(decodeURIComponent($.urlParamRedirect("url")));
    }
});

//var Jsonp_Call_Count = 0;
function Jsonp_Call(_url, _async, callback) {
    try {
        //Jsonp_Call_Count = 0;		
        //setTimeout(function(){
        //Jsonp_Call_Count++;
        Jsonp_Call_RecursiveCall(_url, _async, callback);
        //}, 1000);
    }
    catch (err) { }
}

function Jsonp_Call_RecursiveCall(_url, _async, callback) {
    Jsonp_Call_Process(_url, _async, callback)
}

function Jsonp_Call_Process(_url, _async, callback) {
    try {
        $.ajax({
            crossDomain: true,
            type: "GET",
            contentType: "application/javascript",
            async: _async,
            cache: false,
            url: _url + "&nocachets=" + (new Date().getTime()) + "&deviceInfo=" + _encodeURIComponent(deviceInfo) + "&lon=" + userLongitude + "&lat=" + userLatitude,
            data: {},
            dataType: "jsonp",
            jsonpCallback: callback,
            error: function (jqXHR, textStatus, errorThrown) {
                if (textStatus.toLowerCase() == "error") {
                    $("img[src='Images/loading.gif']").each(function () {
                        $(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
                        $(this).remove();
                    });
                    $("img[src='Images/ajax-loader.gif']").each(function () {
                        $(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
                        $(this).remove();
                    });
                    $("img[src='Images/ajax-loader-min.gif']").each(function () {
                        $(this).parent().prepend("<div class='network-unreachable' style='color: red;'>Network unreachable</div>");
                        $(this).remove();
                    });
                }
            }
        });
    }
    catch (err) { }
}

function SignOut() {
    var _url = serviceRootUrl + "svc.aspx?op=LogOut&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader;
    Jsonp_Call(_url, false, "");

    userInfoData = localstorage.clear("userInfoData");
    isUserLogin = false;

    NavigatePage("#pgLogin");
}

function checkUserLogin() {
    $(".network-unreachable").remove();

    checkConnection();

    var TouchIDAuth = "0";
    if (userInfoData == null) {
        if (localstorage.get("userInfoData") != null) {
            userInfoData = localstorage.get("userInfoData");
        }
        else if (localstorage.get("userInfoData") == null) {
            userInfoData = localstorage.getUserInfoDefault();
        }
    }

    isUserLogin = (userInfoData.AuthenticationHeader != null && userInfoData.AuthenticationHeader != "" &&
					userInfoData.DisplayName != null && userInfoData.DisplayName != "" &&
					userInfoData.Email != null && userInfoData.Email != "" && userInfoData.Expiration > getTimestamp());



    /*
    if (!isUserLogin && location.href.indexOf("#pgLogin") < 0)
	{
		NavigatePage("#pgLogin");
	}
	else if (isUserLogin)
	{	
		$(".spanLoginUser").text("" +userInfoData.DisplayName);
		if (location.href.indexOf("#") < 0 || location.href.indexOf("#pgLogin") > 0)
			NavigatePage("#pgHome");
	}
	*/


    ///// ***** (S) Umer 5/11/2016 : Comment this section to disable touch id */

    var TouchIDAuthenticated = userInfoData.TouchIDAuthenticatedDESR;

    if (CheckTouchIDAvailable()) {
        TouchIDAuth = localstorage.get("TouchIDAuthDESR");
    }

    if (userInfoData.Expiration <= getTimestamp())
        TouchIDAuthenticated = "0";

    //alert(" TouchIDAuth=" + TouchIDAuth + " TouchIDAuthenticated=" + TouchIDAuthenticated);
    if (TouchIDAuth != null && TouchIDAuth != "0" && TouchIDAuthenticated != "1" && CheckTouchIDAvailable()) {
        // Authenticate user the Touch ID way
        if (typeof touchid != 'undefined') {
            touchid.authenticate(
                function (msg) {
                    LoginUserByTouchID(TouchIDAuth);
                },
                function (msg) {
                    TouchIDAuthenticated = "0";
                    NavigatePage("#pgLogin");
                },
                "Please scan your fingerprint to login"
            );
        }
    }
    else {
        if (!isUserLogin && location.href.indexOf("#pgLogin") < 0) {
            NavigatePage("#pgLogin");
        }
        else if (isUserLogin) {
            $(".spanLoginUser").text("" + userInfoData.DisplayName);

            if (userInfoData.CurrentSpecialist == "")
                userInfoData.CurrentSpecialist = userInfoData.ID + "|" + userInfoData.DisplayName + "|" + userInfoData.Login;
            $(".spanCurrentSpecialist").text("" + GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));



            if (location.href.indexOf("#") < 0 || location.href.indexOf("#pgLogin") > 0)
                NavigatePage("#pgHome");
        }

    }

    ///// ***** (E) Umer 5/11/2016 : Comment this section to disable touch id */

    if (isUserLogin) {
        try {
            navigator.geolocation.getCurrentPosition(
        		function (position) {
        		    try {
        		        userLongitude = position.coords.longitude;
        		        userLatitude = position.coords.latitude;
        		    }
        		    catch (err) { }
        		},
        		function (error) {
        		}, 
                { timeout: 10000 }
        	);
        }
        catch (err) { }
    }

    CheckAppVersion();
}




function LoginUserByTouchID(TouchIDAuth) {
    $("#td-error").text("").append(getLoadingMini());
    var loginname = TouchIDAuth;
    userInfoData.AuthenticationHeader = Base64.encode(loginname + ":" + "TouchID");
    var _url = serviceRootUrl + "svc.aspx?op=AuthenticateByTouchID&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader + "&currentURL=" + serviceRootUrl + "main.html"

    Jsonp_Call(_url, true, "callbackLoginByTouchID");
}

function callbackLoginByTouchID(data) {
    try {

        if (data.d.results.issuccess) {
            userInfoData.ID = data.d.results.id;
            userInfoData.DisplayName = data.d.results.name;
            userInfoData.Email = data.d.results.email;
            userInfoData.Phone = data.d.results.phone;
            userInfoData.Login = data.d.results.loginname;
            userInfoData.CurrentSpecialist = userInfoData.ID + "|" + userInfoData.DisplayName + "|" + userInfoData.Login;

            $(".spanLoginUser").text("" + userInfoData.DisplayName);


            userInfoData.Expiration = getTimestamp() + 14400000; //4 hours

            userInfoData.TouchIDAuthenticatedDESR = "1";

            localstorage.set("userInfoData", userInfoData);

            NavigatePage("#pgHome");
        }
        else {
            userInfoData.TouchIDAuthenticatedDESR = "0";
            userInfoData = localstorage.getUserInfoDefault();
            if (CheckTouchIDAvailable()) {
                localstorage.set("TouchIDAuthDESR", "0");
            }

            NavigatePage("#pgLogin");

        }
    }
    catch (err) {
        $('#td-error').html("Internal application error.");
    }
}


function CheckAppVersion() {
    if (!isAppVersionChecking) {
        //alert("CheckAppVersion")
        isAppVersionChecking = true;

        $("#td-error").text("").append(getLoadingMini());
        var _url = serviceRootUrl + "svc.aspx?op=GetCurrentAppVersion"
        Jsonp_Call(_url, true, "callbackCheckAppVersion");
    }
}

function callbackCheckAppVersion(data) {
    try {
        //alert(AppVersion.version + " Build: " + AppVersion.build);

        if (data.d.results.length > 0) {
            var appInfo = data.d.results[0];
            if (appInfo.AppVersion != "" && appInfo.AppVersion != AppVersion.version) {
                var url = appInfo.AppIosUrl;
                if (device.platform == "Android")
                    url = appInfo.AppAndroidUrl;
                else if (device.platform == "WinCE")
                    url = appInfo.AppWindowsUrl;


                $('<div>').simpledialog2({
                    mode: 'blank',
                    headerText: 'New Version Available',
                    headerClose: false,
                    transition: 'flip',
                    themeDialog: 'a',
                    zindex: 2000,
                    blankContent:
                        "<div style='padding: 15px;'>" +
                        appInfo.MessageToUser.replace("APP_URL", url).replace("CURRENT_VERSION", AppVersion.version) +
                        "</div>"
                });
            }
        }
    }
    catch (err) {
        $('#td-error').html("Internal application error.");
    }

    isAppVersionChecking = false;
}



function SelectSpecialist() {
    
    //$("#td-error").text("").append(getLoadingMini());
    var _url = serviceRootUrl + "svc.aspx?op=GetSpecialists&SPUrl=" + spwebRootUrl + SitePath + "&authInfo=" + userInfoData.AuthenticationHeader
    Jsonp_Call(_url, true, "callbackSelectSpecialist");

    $('<div>').simpledialog2({
        id: 'SelectSpecialistPopup',
        mode: 'blank',
        headerText: 'Specialists',
        headerClose: false,
        fullScreen: true,
        fullScreenForce: true,
        transition: 'flip',
        themeDialog: 'a SelectSpecialistPopup',
        zindex: 2000,
        blankContent:
            "<div style='padding: 15px; overflow-y: scroll;height: " + ($(window).height() - 160) + "px;' id='divSelectSpecialistPopupContent'><br /><br />" +
                "<center>" + getLoadingMini() + "</center>" +
            "</div>" + "<a id='SelectSpecialistClose' rel='close' data-role='button' href='#'>Close</a>"
    });
}

function callbackSelectSpecialist(data) {
    try {
        if (data.d.results.length > 0) {
            var html = "";

            for (var i = 0; i < data.d.results.length; i++) {
                var tempuser = data.d.results[i];

                if (userInfoData.CurrentSpecialist.toLowerCase().indexOf(tempuser.LoginName.toLowerCase()) > 0)
                    html += "<div class='SpecialistItem Selected'>" + tempuser.DisplayName + "</div>";
                else
                    html += "<div class='SpecialistItem' onclick='SelectThisSpecialist(\"" + tempuser.SPUserID + "\",\"" + tempuser.DisplayName + "\",\"" + tempuser.LoginName.toLowerCase() + "\");'>" + tempuser.DisplayName + "</div>";
            }
            
            $("#divSelectSpecialistPopupContent").html(html);
            
        }
    }
    catch (err) {
        //$('#td-error').html("Internal application error.");
    }
}

//function capturePhotoWithFile() {
//    navigator.camera.getPicture(onPhotoFileSuccess, onPhotoFileFail, { quality: 50, destinationType: Camera.DestinationType.FILE_URI });
//}

function SelectThisSpecialist(id, displayname, loginname) {
    userInfoData.CurrentSpecialist = id + "|" + displayname + "|" + loginname;
    localstorage.set("userInfoData", userInfoData);
    $(".spanCurrentSpecialist").text("" + GetTokenIndex(userInfoData.CurrentSpecialist, "|", 1));

    $('#SelectSpecialistClose').trigger('click');
    //RefrestPage();
    NavigatePage("#pgHome");
}




function capturePhotoWithData() {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoDataSuccess, onPhotoDataFail, {
        quality: 75,
        destinationType: destinationType.DATA_URL,
        correctOrientation: true,
        targetWidth: 1280,
        targetHeight: 1280
    });
}

function onPhotoDataSuccess(imageData) {

    var newPhoto = $('<div class="captured-photo-div"><span class="captured-photo-delete" onclick="DeletingPhoto($(this).parent());">X</span><img data-id="" data-name="" class="captured-photo" src="" /></div>');
    newPhoto.find("img").attr("src", "data:image/jpeg;base64," + imageData);

    var newIndex = 1;
    $(".add-picture-display").find("img").each(function (index) {
        try {
            var temp = $(this).attr("data-name");
            if (temp.indexOf(".") > 0) {
                temp = temp.split(".")[0];
                temp = temp.split("-")[2];
                newIndex = Math.max(parseInt(temp) + 1, newIndex);
            }
        }
        catch(err) {}
    });
    newPhoto.find("img").attr("data-name", "DESR-" + ($.urlParam("sid") != "" ? $.urlParam("sid"): "XIDX") + "-" + newIndex + ".jpg");

    $(".add-picture-display").append(newPhoto);
}

function getPhotoWithData() {
    // Retrieve image file location from specified source
    navigator.camera.getPicture(onPhotoURISuccess, onPhotoDataFail, {
        quality: 50,
        destinationType: destinationType.FILE_URI,
        sourceType: pictureSource.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1280,
        targetHeight: 1280
    });
}

function onPhotoURISuccess(imageUri) {
    var img = new Image();
    img.onload = function () {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var dataURL;

        canvas.height = this.height;
        canvas.width = this.width;
        ctx.drawImage(this, 0, 0);
        dataURL = canvas.toDataURL("image/jpeg", 1.0);
        onPhotoDataSuccess(dataURL.replace(/^data:image\/(png|jpg|jpeg);base64,/ig, ""));
    };
    img.src = imageUri;
}



function onPhotoDataFail(message) {
    if (message.toLowerCase() != "no image selected") {
        var alertMessage = '<p><b>Failed because:</b></p><p>"' + message + '"</p>';
        $('<div>').simpledialog2({
            mode: 'blank',
            headerText: 'Alert',
            headerClose: false,
            transition: 'flip',
            themeDialog: 'a',
            width: 300,
            zindex: 2000,
            blankContent:
                "<div style='padding: 15px;text-align:center;'><p>" + alertMessage + "</p>" +
                "<table width='100%' cellpadding='0' cellspacing='0'><tr><td><a rel='close' data-role='button' href='#'>OK</a></td></tr></table></div>"
        });
    }
}

var DeletingPhotos = [];
function LoadingPhotos(locationObj, statudId, isEditable) {
    DeletingPhotos = [];

    if (locationObj.find("img").length == 0) {
        var photos = locationObj.attr("data-status-photos");
        
        if (photos != "") {
            var photoTokens = photos.split(";");
            for (var i = 0; i < photoTokens.length; i++) {
                var values = photoTokens[i].split("|");
                if (values.length >= 2) {
                    var imgurl = serviceRootUrl + 'photoview.ashx?pid=' + values[0] + '&authInfo=' + userInfoData.AuthenticationHeader + '&spurl=' + spwebRootUrl + SitePath;
                    var html = '';
                    html += '<div class="captured-photo-div">';
                    if (isEditable) {
                        html += '<span class="captured-photo-delete" onclick="DeletingPhoto($(this).parent());">X</span>';
                    }
                    html += '<img class="captured-photo" data-id="' + values[0] + '" data-name="' + values[1] + '" src="' + imgurl + '&type=thumb' + '" onclick="ViewingPhoto(\'' + imgurl + '&type=full' + '\')" />';
                    html += '</div>';
                    locationObj.append(html);
                }
            }
        }
    }
}

function ViewingPhoto(imgurl) {
    var win = window.open(imgurl, "_blank", "EnableViewPortScale=yes,location=no");
    //win.addEventListener("loadstop", function () {
    //    win.executeScript({ code: "alert( 'hello' );" });
    //});
}

function DeletingPhoto(imageDiv) {
    var imgID = imageDiv.find("img").attr("data-id");
    if (imgID != "")
        DeletingPhotos.push(imgID);

    imageDiv.remove();
}




function OpenNativeSettings() {
    if (typeof cordova.plugins.settings.openSetting != undefined) {
        cordova.plugins.settings.open(function () {
            //console.log("opened settings")
        },
        function () {
            //console.log("failed to open settings")
        });
    }
}













function checkConnection() {
    try {
        var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'It looks like you\'ve lost your connection. Please check that you have a working connection and try again.';

        $(".no-connection-warning").remove();

        if (networkState == Connection.NONE) {
            $('div[role="main"]').prepend("<div class='no-connection-warning'>" + states[networkState] + "</div>");
        }
    }
    catch (err) {
        $(".no-connection-warning").remove();
    }


}





