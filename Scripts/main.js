var serviceRootUrl = Configs.ServiceRootUrl;
var spwebRootUrl = Configs.SharePointRootUrl;

var isPageLoadReady = false;
var isSkipPageLoad = "";
var isUserLogin = false;
var isWebBrowser = false;
var userInfoData = null;
var $scope = null;
var deviceInfo = "";

var userLongitude = 0;
var userLatitude = 0;

var userSearchText = "";
var userSearchSystemType = "All";
	

if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/) && location.href.toLowerCase().indexOf( 'http://' ) < 0 && location.href.toLowerCase().indexOf( 'https://' ) < 0) 
{
	document.addEventListener("deviceready", onDeviceReady, false);
} else {
	isWebBrowser = true;
	$( document ).ready(function() {
		onDeviceReady(); //this is the browser
	});
	
}

function onDeviceReady() {
	$.mobile.pageLoadErrorMessage = "";
	
	if (typeof device != 'undefined')
		deviceInfo = device.model + '|' + device.platform + '|' + device.version;
	else
		deviceInfo = "Browser:" + navigator.browserDetail;
	
	
	try {
		navigator.geolocation.watchPosition(
			function (position) {
				userLongitude = position.coords.longitude;
				userLatitude = position.coords.latitude;
			}, 
			function (error) {
			}
		);
	}
	catch (err) {}
	
	
	localstorage.set("DeviceInfo", deviceInfo);
	
	checkUserLogin();	
	initSystemTypes();
	LoadSystemTypes();
	
	isPageLoadReady = true;
	
};

$( document ).on( "pagebeforeshow", "#pgHome", function(event) {
	checkUserLogin();

	var _url = serviceRootUrl + "svc.aspx?op=LogHomePage&SPUrl=" + spwebRootUrl + "sites/marketing&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, false, "");	
});


$( document ).on( "pagebeforeshow", "#pgHelp", function(event) {
	checkUserLogin();
	$("#td-error").text("");
});

$( document ).on( "pagebeforeshow", "#pgLogin", function(event) {
	checkUserLogin();	
	$("#td-error").text("");
	
	$('#password').keyup(function (event) {
		if (event.which == 13) {
			$("#btnLoginSubmit").click();
		}
	});
	
});

$( document ).on( "pagebeforeshow", "#pgSearch", function(event) {
	$('.ui-content').on('click', '.ui-input-clear', function(e){
		performSearch();
	});
	
	$( "#searchCatalogs" ).keypress(function(e) {
		if (e.keyCode == 13) {
            performSearch();
        }
	});
	
	$("#filterDocumentType").bind( "change", function(event, ui) {
		//performSearch();
	});

	searchAction();
});


function LoginUser()
{
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
	
	userInfoData.AuthenticationHeader = Base64.encode(loginname + ":" + $('#password').val());
	var _url = serviceRootUrl + "svc.aspx?op=Authenticate&SPUrl=" + spwebRootUrl + "sites/marketing&authInfo=" + userInfoData.AuthenticationHeader + "&currentURL=" + serviceRootUrl + "main.html"

	Jsonp_Call(_url, true, "callbackLogin");
}

function callbackLogin( data ){
	try {
		if (data.d.results.issuccess) 
		{
			userInfoData.DisplayName = data.d.results.name;
			userInfoData.Email = data.d.results.email;
			userInfoData.Phone = data.d.results.phone;
			$(".spanLoginUser").text("" +userInfoData.DisplayName);
			
			if ($('#rememberMe').is(':checked'))
				userInfoData.Expiration = getTimestamp() + 1210000000;	//2 weeks
			else
				userInfoData.Expiration = getTimestamp() + 14400000; //4 hours
			
			localstorage.set("userInfoData", userInfoData);
			
			NavigatePage("#pgHome");
		}
		else {
			userInfoData = localstorage.getUserInfoDefault();
			$('#td-error').html("Invalid login and/or password.");
		}
	}
	catch(err) {
		$('#td-error').html("Internal application error.");
	}
}


function initSystemTypes()
{
	//Load System Types from localstorage
	var localSystemTypes = localstorage.get("localSystemTypes");
	if (localSystemTypes != null && localSystemTypes != "")
	{
		$('#filterDocumentType option[value!="All"]').remove();			
		var _localSystemTypes = localSystemTypes.split(";");
		for (var i = 0; i < _localSystemTypes.length; i++)
		{
			if (_localSystemTypes[i] != "")
				$("#filterDocumentType").append("<option value='" + _localSystemTypes[i] + "' "+ ((userSearchSystemType == $.trim(_localSystemTypes[i])) ? "selected" : "") +">" + _localSystemTypes[i] + "</option>");
		}
		
		try {
			$('#filterDocumentType').selectmenu("refresh");
		} catch (err) {}
	}
}

function LoadSystemTypes()
{
	var _url = serviceRootUrl + "svc.aspx?op=GetSystemTypes&SPUrl=" + spwebRootUrl + "sites/busops";
	Jsonp_Call(_url, true, "callbackPopulateSystemTypes");	
}

function callbackPopulateSystemTypes(data)
{
	try {
		if (data.d.results.length > 0)
		{
			$('#filterDocumentType option[value!="All"]').remove();
			
			var localSystemTypes = "";
			for (var i = 0; i < data.d.results.length; i++)
			{
				$("#filterDocumentType").append("<option value='" + data.d.results[i] + "' " + (userSearchSystemType== data.d.results[i] ? " selected " : "") + ">" + data.d.results[i] + "</option>");
				localSystemTypes += data.d.results[i] + ";";
			}		
			
			try {
				$('#filterDocumentType').selectmenu("refresh");
			} catch (err) {}
			
			localstorage.set("localSystemTypes", localSystemTypes);
		}
	}
	catch(err) {}
}

function performSearch()
{
	NavigatePage("#pgRedirect?url=#pgSearch");
}

function searchAction()
{
	$( "#divSearchResults" ).text("").append( getLoadingImg() );
	
	userSearchText = $("#searchCatalogs").val();
	userSearchSystemType = $("#filterDocumentType").val();
	
	var searchURL = serviceRootUrl + "svc.aspx?op=SearchCatalogs&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&searchText=" + userSearchText + "&modality=All&documentType=" + userSearchSystemType;
	
	Jsonp_Call(searchURL, false, "callbackPopulateSearchResults");
}

function callbackPopulateSearchResults(data)
{
	try {
		$( "#divSearchResults" ).text("");
		
		if (data.d.results.length > 0)
		{
			for(var i=0; i < data.d.results.length; i++)
			{
				var catalog = data.d.results[i];
				var temp = "";
				temp += '<table class="search-item">';
					temp += '<tr>';
						if (catalog.ImageURL != "")
							temp += '<td class="catalog-img"><div><img class="img-icon" src="' + serviceRootUrl + catalog.ImageURL + '" /></div></td>';
						else
							temp += '<td class="catalog-img"><div><img class="img-icon" src="images/no_image.jpg" /></div></td>';
						temp += '<td class="catalog-info">';
							temp += '<div class="div-catalog-info">';
								temp += '<span class="head-cat">' + catalog.Modality + ' (' + catalog.SystemType + ')</span><br />';
								temp += 'Serial Number: ' + catalog.Product + '<br />';
								temp += 'Software Version: ' + catalog.Software_x0020_Version + ' (Revision ' + catalog.Revision_x0020_Level + ')<br />';
								temp += 'Last Updated By: ' + catalog.MCSS.substring(catalog.MCSS.indexOf("#") + 1) + '<br /><br />';
								temp += 'Last Updated: ' + catalog.System_x0020_Date.substring(0, catalog.System_x0020_Date.indexOf(" ")) + '';
							temp += '</div>';
						temp += '</td>';
					temp += '</tr>';
					temp += '<tr>';
						temp += '<td class="td-add-to-cart" valign="bottom" colspan="4">';
							temp += '<div class="div-catalog-add">';
								temp += '<a data-mini="true" data-inline="true" data-role="button" href="javascript: addStatusAction('+catalog.ID+');" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-theme="c" class="ui-btn ui-shadow ui-btn-corner-all ui-mini ui-btn-inline ui-btn-up-c"><span class="ui-btn-inner ui-btn-corner-all"><span class="ui-btn-text">Add Status</span></span></a>';
							temp += '</div>';
						temp += '</td>';
					temp += '</tr>';
				temp += '</table>';
			
				$( "#divSearchResults" ).append(temp);
			}
			
			//$(".btnAddStatus").button('refresh');
			$('.btnAddStatus').attr("data-theme", "a").removeClass("ui-btn-up-e").addClass("ui-btn-up-a");
		}
		else
		{
			//no item
			var temp = "<br /><center>No item found.</center>";
			
			temp += "<br />";			
			if (userSearchText != "")
				temp += "<div><center><i>Keyword:</i> <b>"+ userSearchText +"</b></center></div>";

			temp += "<div><center><i>System Type:</i> <b>"+ userSearchSystemType +"</b></center></div>";
			
			$( "#divSearchResults" ).text("").append(temp);
		}
	}
	catch(err) {
		$( "#divSearchResults" ).text("").append("Internal application error.");
	}
}




/******************* History ***********************/
$( document ).on( "pagebeforeshow", "#pgHistory", function(event) {	
	checkUserLogin();
	
	$( "#divHistoryResults" ).text("").append(getLoadingImg());	
	
	var _url = serviceRootUrl + "svc.aspx?op=GetHistoryStatuses&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, false, "callbackPopulateHistories");
});

function callbackPopulateHistories(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			$( "#divHistoryResults" ).text("");
			
			for(var i=0; i < data.d.results.length; i++)
			{
				var status = data.d.results[i];
				var temp = "";
					temp += '<table class="table-catalog-info">';
						temp += '<tr>';
							temp += '<td class="catalog-info">';
								temp += '<div class="col-xs-12 div-history-status-info history-collapsed itemid_' + status.ID + '">';
									temp += '<table width="100%" cellpadding="0" cellspacing="0"><tr><td onclick="toggleHistoryStatusDetails(this)"  valign="top">';
										temp += '<table width="100%" cellpadding="0" cellspacing="0"><tr>';
										temp += '<td rowspan="2" class="collapsed-expanded-icon" valign="middle"><div>&nbsp;</div></td>';
										temp += '<td valign="top"><span class="head-cat"><b>' + status.Modality + ' (' + status.SystemType + ')</b></span></td>';										
										temp += '<td align="right">' + status.Modified + '</td></tr>';
										temp += '<tr><td valign="top">Serial #: ' + status.SerialNumber + '</td>';
										temp += '<td align="right">Submission: <i>' + (status.IsFinal == "Yes" ? "<b>Final</b>" : "Draft") + '</i></td></tr>';
										temp += '</table>';
										
									if (status.IsFinal == "No")
										temp += "</td><td width='40' align='right' valign='middle'> <a href=''javascript:void(0);' onclick='NavigatePage(\"#pgAddStatus?sid=" + status.ID + "\")' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext'></a>";
									else
										temp += "</td><td width='40' align='right' valign='middle'> <a href='javascript:void(0);' class='ui-btn ui-icon-edit ui-mini ui-btn-icon-notext ui-disabled'></a>";
									temp += "</td></tr></table>";
								temp += '</div>  ';
								temp += '<div id="divHistoryStatusDetails">  ';
									temp += '<table width="100%">';
										temp += '<tr>';
											temp += '<td class="history-item-title" width="30%">System serial number:</td>';
											temp += '<td class="history-item-value" width="70%">' + status.SerialNumber + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Software version:</td>';
											temp += '<td class="history-item-value">' + status.SoftwareVersion + '</td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">Revision Level:</td>';
											temp += '<td class="history-item-value">' + status.RevisionLevel + '</td>';
										temp += '</tr>';
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
											temp += '<td class="history-item-title" width="50%">Control panel layout:</td>';
											temp += '<td class="history-item-value" width="50%">' + status.ControlPanelLayout + '</td>';
										temp += '</tr>';
										if (status.ControlPanelLayout=='Control panel changed') {
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
										
										if (status.AllSoftwareLoadedAndFunctioning=='No') {
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
											temp += '<td class="history-item-section-header" colspan="4"><b>Before leaving customer site</b></td>';
										temp += '</tr>';
										temp += '<tr>';
											temp += '<td class="history-item-title">System performed as expected:</td>';
											temp += '<td class="history-item-value">' + status.SystemPerformedAsExpected + '</td>';
										temp += '</tr>';
										
										if (status.SystemPerformedAsExpected=='No') {
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
										
										if (status.AdditionalComments !='') {
											temp += '<tr>';
												temp += '<td class="history-item-value" colspan="2" style="font-weight:normal;">';
													temp += '<div>' + status.AdditionalComments + '</div>';
												temp += '</td>';
											temp += '</tr>';
										}
										if (status.AdditionalComments=='') {
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
									temp += '</table> '; 
								temp += '</div> ';        
							temp += '</td>';
						temp += '</tr>';
					temp += '</table>';
					temp += '<div class="divRowSeparator"></div>';
					
					
				$("#divHistoryResults").append(temp);
			}
			
			var _id = $.urlParam("id");
			if (_id != "" && parseInt(_id) > 0)
			{
				$("div.itemid_" + _id).removeClass("history-collapsed").addClass("history-expanded");
				$("div.itemid_" + _id).next().show();
			}
		}
		else 
		{
			$( "#divHistoryResults" ).text("").append("<br /><center>No history found.</center>");
		}
	}
	catch(err) {
		$( "#divHistoryResults" ).text("").append("Internal application error.");
	}
}

function toggleHistoryStatusDetails(obj) {
    if ($(obj).closest("div").hasClass("history-collapsed")) {
        $(obj).closest("div").removeClass("history-collapsed").addClass("history-expanded");
        $(obj).closest("div").next().show();
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
		
		var _url = serviceRootUrl + "svc.aspx?op=AddAdditionalComments&SPUrl=" + spwebRootUrl + "sites/busops&itemid=" + id + "&comment=" + comment + "&authInfo=" + userInfoData.AuthenticationHeader + "&WorkPhone=" + userInfoData.Phone;
		Jsonp_Call(_url, false, "callbackAddComment");
	}
	else {
		$("#divAddCommentError" + id).text("").append("* Comment cannot be empty").show();
	}
};

function callbackAddComment(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			NavigatePage("#pgRedirect?url=" + encodeURIComponent("#pgHistory?id=" + data.d.results[0]));
		}
	}
	catch(err) { }
}


/******************* Add Status ***********************/
$( document ).on( "pagebeforeshow", "#pgAddStatus", function(event) {
	checkUserLogin();
	
	//clear the form
	$("table.table-add-status").find("input").each(function() {
		if ($(this).attr("type") == "text")
			$(this).val("");
		if ($(this).attr("type") == "radio")
			$(this).filter('[value=Yes]').prop('checked', true);
	});	
	$("table.table-add-status").find("input[type=radio]").checkboxradio("refresh");
	$("#allSoftwareLoadedAndFunctioningReasonTR").hide();
	$("#LayoutChangeExplainTR").hide();
	$("#systemPerformedNotAsExpectedExplainTR").hide();
	$("#selectModality").val('UL').selectmenu('refresh', true);
	$('#error-div2').text("");
	$('#Comments').val("");
	
	
	
	if ($.urlParam("id") == "")
	{
		$(".add-new-status").show();
		$(".add-status").hide();
		//$("#btnSubmitFinal").hide();
		
		var today = new Date();
		$("#catalog_System_x0020_Date").text((today.getMonth()+1) + '/' + today.getDate() + '/' + today.getFullYear());
		$("#catalog_MCSS").text(userInfoData.DisplayName);
	}
	else 
	{
		$(".add-new-status").hide();
		$(".add-status").show();
		//$("#btnSubmitFinal").show();
	}
	
	if ($.urlParam("sid") != "")
	{
		$("#divStatusId").text($.urlParam("sid"));
		//$("#btnSubmitFinal").show();
	}
	else
		$("#divStatusId").text("");
	
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
	
	$("#controlPanelLayout").change(function () {
		if ($(this).val() == "Control panel changed")
			$("#LayoutChangeExplainTR").show();
		else
			$("#LayoutChangeExplainTR").hide();
	});
	
	//Load CPL from localstorage
	var lookupCPLValues = localstorage.get("lookupCPLValues");
	if (lookupCPLValues != null && lookupCPLValues != "")
	{
		$('#controlPanelLayout option[value!="N/A"]').remove();
		var _lookupCPLValues = lookupCPLValues.split(";");
		for (var i = 0; i < _lookupCPLValues.length; i++)
		{
			if (_lookupCPLValues[i] != "")
				$("#controlPanelLayout").append("<option value='" + _lookupCPLValues[i] + "'>" + _lookupCPLValues[i] + "</option>");
		}
		$("#controlPanelLayout").selectmenu('refresh', true);
	}
	
	var _url1 = serviceRootUrl + "svc.aspx?op=GetCPLValues&SPUrl=" + spwebRootUrl + "sites/busops";
	Jsonp_Call(_url1, false, "callbackGetCPLValues");
	
	//Populate the draft data
	if (isNumber($("#divStatusId").text()))
	{
		var _url = serviceRootUrl + "svc.aspx?op=GetHistoryStatusById&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $("#divStatusId").text();
		Jsonp_Call(_url, true, "callbackLoadDraftStatus");
	}
	

	var id = $.urlParam("id");
	if (id > 0)
	{
		var _url2 = serviceRootUrl + "svc.aspx?op=GetCatalogById&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&id=" + id;
		Jsonp_Call(_url2, true, "callbackLoadAddStatus");
	}
	else 
	{
		///
	}
});

function callbackLoadAddStatus(data)
{
	try {
		if (data.d.results.length > 0)
		{
			var catalog = data.d.results[0];
			$("#catalog_SystemType").text(catalog.SystemType);
			$("#catalog_Product").text(catalog.Product);
			$("#catalog_Software_x0020_Version").text(catalog.Software_x0020_Version);
			$("#catalog_Revision_x0020_Level").text(catalog.Revision_x0020_Level);
			$("#catalog_System_x0020_Date").text(catalog.System_x0020_Date.substring(0, catalog.System_x0020_Date.indexOf(" ")));
			$("#catalog_MCSS").text(catalog.MCSS.substring(catalog.MCSS.indexOf("#") + 1));
			$("#catalog_Modality").text(catalog.Modality);
			
		}
		else
		{
			//
		}
	}
	catch(err) {}
}

function callbackGetCPLValues(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			$('#controlPanelLayout option[value!="N/A"]').remove();
			var lookupCPLValues = "";
			for (var i = 0; i < data.d.results.length; i++)
			{
				$("#controlPanelLayout").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
				lookupCPLValues +=  data.d.results[i] + ";";
			}
			$("#controlPanelLayout").selectmenu('refresh', true);
			localstorage.set("lookupCPLValues", lookupCPLValues);
		}
		else
		{
			//
		}
	}
	catch(err) {}
}

function callbackLoadDraftStatus(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0)
		{
			var item = data.d.results[0];
			
			$("#inputSystemType").val(item.SystemType);
			$("#inputSystemSerialNumber").val(item.SerialNumber);
			$("#inputSoftwareVersion").val(item.SoftwareVersion);
			$("#inputRevisionLevel").val(item.RevisionLevel);
			$("#selectModality").val(item.Modality).selectmenu('refresh', true);
			
			$("#Comments").val(item.Comments);
			$("#controlPanelLayout").val(item.ControlPanelLayout).selectmenu('refresh', true);
			SetRadioValue('modalityWorkListEmpty', item.ModalityWorkListEmpty);
			SetRadioValue('allSoftwareLoadedAndFunctioning', item.AllSoftwareLoadedAndFunctioning);
			$("#allSoftwareLoadedAndFunctioningReason").val(item.IfNoExplain);
			SetRadioValue('nPDPresetsOnSystem', item.NPDPresetsOnSystem);
			SetRadioValue('hDDFreeOfPatientStudies', item.HDDFreeOfPatientStudies);
			SetRadioValue('demoImagesLoadedOnHardDrive', item.DemoImagesLoadedOnHardDrive);
			SetRadioValue('systemPerformedAsExpected', item.SystemPerformedAsExpected);
			$("#systemPerformedNotAsExpectedExplain").val(item.SystemPerformedNotAsExpectedExplain);
			SetRadioValue('wereAnyIssuesDiscoveredWithSystemDuringDemo', item.AnyIssuesDuringDemo);
			SetRadioValue('wasServiceContacted', item.wasServiceContacted);
			SetRadioValue('ConfirmSystemHddEmptiedOfAllPatientStudies', item.ConfirmModalityWorkListRemoved);
			SetRadioValue('ConfirmModalityWorkListRemovedFromSystem', item.ConfirmSystemHDDEmptied);
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
			
			if ($("#controlPanelLayout").val() == "Control panel changed")
				$("#LayoutChangeExplainTR").show();
			else
				$("#LayoutChangeExplainTR").hide();
		}
		else
		{
			//
		}
	}
	catch(err) { }
}


function cancelStatus() {
	$('<div>').simpledialog2({
		mode: 'blank',
		headerText: 'Confirmation',
		headerClose: false,
		transition: 'flip',
		themeDialog: 'a',
		zindex: 2000,
		blankContent : 
		  "<div style='padding: 15px;'><p>Cancel the status update and go back to main screen?</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"NavigatePage('#pgHome');\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    }); 
}

function saveStatus(isFinal) {
	$scope = {
		recordId : $.urlParam("id"),
		Comments : $("#Comments").val(),
		controlPanelLayout : $("#controlPanelLayout").val(),
		modalityWorkListEmpty : $('input[name=modalityWorkListEmpty]:checked').val(),
		allSoftwareLoadedAndFunctioning : $('input[name=allSoftwareLoadedAndFunctioning]:checked').val(),
		allSoftwareLoadedAndFunctioningReason : $("#allSoftwareLoadedAndFunctioningReason").val(),
		nPDPresetsOnSystem : $('input[name=nPDPresetsOnSystem]:checked').val(),
		hDDFreeOfPatientStudies : $('input[name=hDDFreeOfPatientStudies]:checked').val(),
		demoImagesLoadedOnHardDrive : $('input[name=demoImagesLoadedOnHardDrive]:checked').val(),
		systemPerformedAsExpected : $('input[name=systemPerformedAsExpected]:checked').val(),
		systemPerformedNotAsExpectedExplain : $("#systemPerformedNotAsExpectedExplain").val(),
		wereAnyIssuesDiscoveredWithSystemDuringDemo : $('input[name=wereAnyIssuesDiscoveredWithSystemDuringDemo]:checked').val(),
		wasServiceContacted : $('input[name=wasServiceContacted]:checked').val(),
		ConfirmSystemHddEmptiedOfAllPatientStudies : $('input[name=ConfirmSystemHddEmptiedOfAllPatientStudies]:checked').val(),
		ConfirmModalityWorkListRemovedFromSystem : $('input[name=ConfirmModalityWorkListRemovedFromSystem]:checked').val(),
		LayoutChangeExplain : $("#LayoutChangeExplain").val(),
		userInfo: {WorkPhone: userInfoData.Phone},
		
		SystemType : $("#inputSystemType").val(),
		SystemSerialNumber : $("#inputSystemSerialNumber").val(),
		SoftwareVersion : $("#inputSoftwareVersion").val(),
		RevisionLevel : $("#inputRevisionLevel").val(),
		Modality : $("#selectModality").val(),
		StatusId : $("#divStatusId").text()
	};

	//console.log($scope);
	
	if ($scope.recordId == "" || !($scope.recordId > 0))
	{
		if ((isFinal == "Yes") && ($scope.SystemType == "" || $scope.SystemSerialNumber == "" || $scope.SoftwareVersion == "" || $scope.Modality == ""))
		{
			$('#error-div').html('Please select all values.');
			showTimedElem('error-div');
			$('#error-div2').html('Please select all values.');
			showTimedElem('error-div2');
			//showLoading(false);
			return;
		}
	}


	if ((isFinal == "Yes") && ($scope.controlPanelLayout == "" || $scope.modalityWorkListEmpty == "" || $scope.allSoftwareLoadedAndFunctioning == "" || $scope.nPDPresetsOnSystem == "" || $scope.hDDFreeOfPatientStudies == "" || $scope.demoImagesLoadedOnHardDrive == "" || $scope.systemPerformedAsExpected == "" || $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "" || $scope.ConfirmSystemHddEmptiedOfAllPatientStudies == "" || $scope.ConfirmModalityWorkListRemovedFromSystem == "")) {
		$('#error-div').html('Please select all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please select all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ((isFinal == "Yes") && ($scope.controlPanelLayout == "Control panel changed" && $scope.LayoutChangeExplain == "")) {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ((isFinal == "Yes") && ($scope.allSoftwareLoadedAndFunctioning == "No" && $scope.allSoftwareLoadedAndFunctioningReason == "")) {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ((isFinal == "Yes") && ($scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "Yes" && $scope.wasServiceContacted == "")) {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
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
		blankContent : 
		  "<div style='padding: 15px;'><p>" + confirmMessage + "</p>"+
		  "<table width='100%' cellpadding='0' cellspacing='0'><tr><td width='50%'><a rel='close' data-role='button' href='#' onclick=\"SaveStatusProcess('" + isFinal + "');\">OK</a></td>" + 
		  "<td width='50%'><a rel='close' data-role='button' href='#'>Cancel</a></td></tr></table></div>"
    });
}
	
function SaveStatusProcess(isFinal)
{
	if ($scope) {
		
		//show saving animation
		$('#error-div2').text("").append(getLoadingMini());
		showTimedElem('error-div2');
	
		if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
		{
			//showLoading(true);
			var _url =  serviceRootUrl + "svc.aspx?op=AddStatus&SPUrl=" + spwebRootUrl + "sites/busops&recordId=" + $scope.recordId + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
			
			Jsonp_Call(_url, true, "callbackSaveStatus");
		}
		else 
		{
			var _url =  serviceRootUrl + "svc.aspx?op=AddNewStatus&SPUrl=" + spwebRootUrl + "sites/busops&SerialNumber=" + $scope.SystemSerialNumber + "&SoftwareVersion=" + $scope.SoftwareVersion + "&RevisionLevel=" + $scope.RevisionLevel + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader + "&statusId=" + $scope.StatusId;
			
			Jsonp_Call(_url, true, "callbackSaveStatus");
		}
	}
}

function callbackSaveStatus(data)
{
	try {
		//console.log(data);
		if (data.d.results.length > 0 && parseInt(data.d.results[0]) > 0)
		{
			NavigatePage('#pgHistory');
		}
		else 
		{
			//
		}
	}
	catch(err) { }
}

/******************* Redirect Page ***********************/
$( document ).on( "pagebeforeshow", "#pgRedirect", function(event) {
	if ($.urlParamRedirect("url"))
	{
		NavigatePage(decodeURIComponent($.urlParamRedirect("url")));
	}
});

var Jsonp_Call_Count = 0;
function Jsonp_Call(_url, _async, callback)
{
	try {
		Jsonp_Call_Count = 0;		
		setTimeout(function(){
			Jsonp_Call_Count++;
			Jsonp_Call_RecursiveCall(_url, _async, callback);
		}, 1000);
	}
	catch (err) {}	
}

function Jsonp_Call_RecursiveCall(_url, _async, callback)
{
	if (userLongitude != 0 || userLongitude != 0 || Jsonp_Call_Count >= 5)
	{
		Jsonp_Call_Process(_url, _async, callback)
	}
	else
	{
		setTimeout(function(){
			Jsonp_Call_Count++;
			Jsonp_Call_RecursiveCall(_url, _async, callback);
		}, 1000);
	}
}

function Jsonp_Call_Process(_url, _async, callback)
{
	try {	
		$.ajax({
				crossDomain: true,
				type:"GET",
				contentType: "application/javascript",
				async:_async,
				cache: false,
				url: _url + "&nocachets=" + (new Date().getTime()) + "&deviceInfo=" + _encodeURIComponent(deviceInfo) + "&lon=" + userLongitude + "&lat=" + userLatitude,
				data: {},
				dataType: "jsonp",                
				jsonpCallback: callback,
				error: function(jqXHR, textStatus, errorThrown) {
					if (textStatus.toLowerCase() == "error")
					{
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
	catch(err) { }
}

function SignOut()
{
	var _url = serviceRootUrl + "svc.aspx?op=LogOut&SPUrl=" + spwebRootUrl + "sites/marketing&authInfo=" + userInfoData.AuthenticationHeader;
	Jsonp_Call(_url, false, "");

	userInfoData = localstorage.clear("userInfoData");
	isUserLogin = false;
	
	NavigatePage("#pgLogin");
}

function checkUserLogin()
{
	$(".network-unreachable").remove();
	
	checkConnection();
	if (userInfoData == null)
	{
		if (localstorage.get("userInfoData") != null)
		{
			userInfoData = localstorage.get("userInfoData");
		}
		else if (localstorage.get("userInfoData") == null)
		{
			userInfoData = localstorage.getUserInfoDefault();
		}
	}
	
	isUserLogin = (userInfoData.AuthenticationHeader != null && userInfoData.AuthenticationHeader != "" && 
					userInfoData.DisplayName != null && userInfoData.DisplayName != "" &&
					userInfoData.Email != null && userInfoData.Email != "" && userInfoData.Expiration > getTimestamp());
	
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
}

function checkConnection() {
	try {
		var networkState = navigator.connection.type;
		var states = {};
		states[Connection.UNKNOWN]  = 'Unknown connection';
		states[Connection.ETHERNET] = 'Ethernet connection';
		states[Connection.WIFI]     = 'WiFi connection';
		states[Connection.CELL_2G]  = 'Cell 2G connection';
		states[Connection.CELL_3G]  = 'Cell 3G connection';
		states[Connection.CELL_4G]  = 'Cell 4G connection';
		states[Connection.CELL]     = 'Cell generic connection';
		states[Connection.NONE]     = 'It looks like you\'ve lost your connection. Please check that you have a working connection and try again.';
		
		$(".no-connection-warning").remove();
			
		if (networkState == Connection.NONE)
		{
			$('div[role="main"]').prepend( "<div class='no-connection-warning'>" + states[networkState] + "</div>" );
		}
	}
	catch (err) {
		$(".no-connection-warning").remove();
	}
	
	
}





