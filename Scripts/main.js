var serviceRootUrl = "http://tusspdev1/VirtualApps/BusOpsWebs/TAMS.BUSOPS.DemoESR.MobileSVC/";
var spwebRootUrl = "http://tusspdev1/";


var isUserLogin = false;
var userInfoData = null;

$(document).ready(function () {
	checkUserLogin();
});

$( document ).on( "pagebeforeshow", "#pgHome", function(event) {
	checkUserLogin();
});

$( document ).on( "pagebeforeshow", "#pgHelp", function(event) {
	checkUserLogin();
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

function ShowHelp()
{
	NavigatePage( "#pgHelp" );
}

function SignOut()
{
	$.ajax({
		crossDomain: true,
		type:"GET",
		contentType: "application/json; charset=utf-8",
		async:false,
		url: serviceRootUrl + "svc.aspx?op=LogOut&SPUrl=" + spwebRootUrl + "sites/marketing&authInfo=" + userInfoData.AuthenticationHeader,
		data: {},
		dataType: "jsonp",                
		jsonpCallback: "",
    });

	userInfoData = localstorage.clear("userInfoData");
	isUserLogin = false;
	
	NavigatePage("#pgLogin");
}


function checkUserLogin()
{
	if (userInfoData == null)
	{
		if (localstorage.get("userInfoData") != null)
		{
			userInfoData = localstorage.get("userInfoData");
		}
		else if (localstorage.get("userInfoData") == null)
		{
			userInfoData = getUserInfoDefault();
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
	
	var loginname = ($('#login').val().indexOf("\\") > 0) ? $('#login').val() : "tamsdomain\\" + $('#login').val();
	userInfoData.AuthenticationHeader = Base64.encode(loginname + ":" + $('#password').val());
	var _url = serviceRootUrl + "svc.aspx?op=Authenticate&SPUrl=" + spwebRootUrl + "sites/marketing&authInfo=" + userInfoData.AuthenticationHeader + "&currentURL=" + serviceRootUrl + "main.html"

	$.ajax({
            crossDomain: true,
            type:"GET",
            contentType: "application/json; charset=utf-8",
            async:true,
			cache: false,
            url: _url,
            data: {},
            dataType: "jsonp",                
            jsonpCallback: "callbackLogin",
    });
}

function callbackLogin( data ){
	if (data.d.results.issuccess) 
	{
		userInfoData.DisplayName = data.d.results.name;
		userInfoData.Email = data.d.results.email;
		loggedUserPhone = data.d.results.phone;
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



$( document ).on( "pagebeforeshow", "#pgSearch", function(event) {
	checkUserLogin();
	
	$('#searchCatalogs').keyup(function (event) {
		if (event.which == 13) {
			NavigatePage("#pgSearch?keyword=" + $('#searchCatalogs').val() + "&systemtype=" + $("#filterDocumentType").val());
			performSearch();
		}
	});
	
	$("#filterDocumentType").change(function (event) {
		NavigatePage("#pgSearch?keyword=" + $('#searchCatalogs').val() + "&systemtype=" + $("#filterDocumentType").val());
		performSearch();
	})
	
	$("#searchCatalogs").val($.urlParam("keyword"));	
	$( "#divSearchResults" ).text("").append( getLoadingImg() );	
	$.ajax({
		crossDomain: true,
		type:"GET",
		contentType: "application/json; charset=utf-8",
		async:false,
		url: serviceRootUrl + "svc.aspx?op=GetSystemTypes&SPUrl=" + spwebRootUrl + "sites/busops",
		data: {},
		dataType: "jsonp",                
		jsonpCallback: "callbackPopulateSystemTypes",
    });
	
	performSearch();
});

function callbackPopulateSystemTypes(data)
{
	if (data.d.results.length > 0)
	{
		$('#filterDocumentType option[value!="All"]').remove();
		
		var _systemType = $.urlParam("systemtype");
		for (var i = 0; i < data.d.results.length; i++)
		{
			$("#filterDocumentType").append("<option value='" + data.d.results[i] + "' "+ ((_systemType == $.trim(data.d.results[i])) ? "selected" : "") +">" + data.d.results[i] + "</option>");
		}
		$("#filterDocumentType").selectmenu('refresh', true);
	}
}

function performSearch()
{
	$( "#divSearchResults" ).text("").append( getLoadingImg() );
	var searchURL = serviceRootUrl + "svc.aspx?op=SearchCatalogs&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&searchText=" + $("#searchCatalogs").val() + "&modality=All&documentType=" + ($.urlParam("systemtype") == "" ? "All": $.urlParam("systemtype"));
	$.ajax({
		crossDomain: true,
		type:"GET",
		contentType: "application/json; charset=utf-8",
		async:false,
		url: searchURL,
		data: {},
		dataType: "jsonp",                
		jsonpCallback: "callbackPopulateSearchResults",
    });
}

function callbackPopulateSearchResults(data)
{
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
		$( "#divSearchResults" ).text("").append("<br /><center>No item found.</center>");
	}
}




/******************* History ***********************/
$( document ).on( "pagebeforeshow", "#pgHistory", function(event) {	
	checkUserLogin();
	
	$( "#divHistoryResults" ).text("").append(getLoadingImg());	
	$.ajax({
		crossDomain: true,
		type:"GET",
		contentType: "application/json; charset=utf-8",
		async:true,
		url: serviceRootUrl + "svc.aspx?op=GetHistoryStatuses&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader,
		data: {},
		dataType: "jsonp",                
		jsonpCallback: "callbackPopulateHistories",
    });
});

function callbackPopulateHistories(data)
{
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
                            temp += '<div class="col-xs-12 div-history-status-info history-collapsed itemid_' + status.ID + '" onclick="toggleHistoryStatusDetails(this)">';
                                temp += '<span class="head-cat"><b>' + status.Modality + ' (' + status.SystemType + ')</b></span>';
                                temp += '<span style="float:right;">' + status.Modified + '</span>';
                                temp += '<div style="">Serial #: ' + status.SerialNumber + '</div>';
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

function toggleHistoryStatusDetails(obj) {
    if ($(obj).hasClass("history-collapsed")) {
        $(obj).removeClass("history-collapsed").addClass("history-expanded");
        $(obj).next().show();
    }
    else {
        $(obj).removeClass("history-expanded").addClass("history-collapsed");
        $(obj).next().hide();
    }
}

function saveAdditionalComment(id) {
	var comment = $("#taAdditionalComment" + id).val();

	$("#divAddCommentError" + id).hide();

	if (jQuery.trim(comment) != "") {
		$("#divAddCommentError" + id).text("").append(getLoadingMini()).show();
		
		$.ajax({
			crossDomain: true,
			type:"GET",
			contentType: "application/json; charset=utf-8",
			async:true,
			url: serviceRootUrl + "svc.aspx?op=AddAdditionalComments&SPUrl=" + spwebRootUrl + "sites/busops&itemid=" + id + "&comment=" + comment + "&authInfo=" + userInfoData.AuthenticationHeader,
			data: {},
			dataType: "jsonp",                
			jsonpCallback: "callbackAddComment",
		});
	}
	else {
		$("#divAddCommentError" + id).text("").append("* Comment cannot be empty").show();
	}
};

function callbackAddComment(data)
{
	//console.log(data);
	if (data.d.results.length > 0)
	{
		NavigatePage("#pgRedirect?url=" + encodeURIComponent("#pgHistory?id=" + data.d.results[0]));
	}
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
	$("#selectModality").prop('selectedIndex', 0);
	
	
	if ($.urlParam("id") == "")
	{
		$(".add-new-status").show();
		$(".add-status").hide();
		$("#btnSubmitFinal").hide();
		
		var today = new Date();
		$("#catalog_System_x0020_Date").text((today.getMonth()+1) + '/' + today.getDate() + '/' + today.getFullYear());
		$("#catalog_MCSS").text(userInfoData.DisplayName);
	}
	else 
	{
		$(".add-new-status").hide();
		$(".add-status").show();
		$("#btnSubmitFinal").show();
	}

	
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
	
	$.ajax({
		crossDomain: true,
		type:"GET",
		contentType: "application/json; charset=utf-8",
		async:false,
		url: serviceRootUrl + "svc.aspx?op=GetCPLValues&SPUrl=" + spwebRootUrl + "sites/busops",
		data: {},
		dataType: "jsonp",                
		jsonpCallback: "callbackGetCPLValues"
	});
	

	var id = $.urlParam("id");
	if (id > 0)
	{
		$.ajax({
			crossDomain: true,
			type:"GET",
			contentType: "application/json; charset=utf-8",
			async:false,
			url: serviceRootUrl + "svc.aspx?op=GetCatalogById&SPUrl=" + spwebRootUrl + "sites/busops&authInfo=" + userInfoData.AuthenticationHeader + "&id=" + id,
			data: {},
			dataType: "jsonp",                
			jsonpCallback: "callbackLoadAddStatus"
		});
	}
	else 
	{
		///
	}
});

function callbackLoadAddStatus(data)
{
	if (data.d.results.length > 0)
	{
		var catalog = data.d.results[0];
		$("#catalog_SystemType").text(catalog.SystemType);
		$("#catalog_Product").text(catalog.Product);
		$("#catalog_Software_x0020_Version").text(catalog.Software_x0020_Version);
		$("#catalog_Revision_x0020_Level").text(catalog.Revision_x0020_Level);
		$("#catalog_System_x0020_Date").text(catalog.System_x0020_Date.substring(0, catalog.System_x0020_Date.indexOf(" ")));
		$("#catalog_MCSS").text(catalog.MCSS.substring(catalog.MCSS.indexOf("#") + 1));
	}
	else
	{
		//
	}
}

function callbackGetCPLValues(data)
{
	//console.log(data);
	if (data.d.results.length > 0)
	{
		$('#controlPanelLayout option[value!=""]').remove();
		for (var i = 0; i < data.d.results.length; i++)
		{
			$("#controlPanelLayout").append("<option value='" + data.d.results[i] + "'>" + data.d.results[i] + "</option>");
		}
		$("#controlPanelLayout").selectmenu('refresh', true);
	}
	else
	{
		//
	}
}


function cancelStatus() {
	var sure = confirm('Cancel the status update and go back to main screen?');
	if (sure) {
		NavigatePage('#pgHome');
	}
}

function saveStatus(isFinal) {
	var $scope = {
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
		userInfo: {WorkPhone: loggedUserPhone},
		
		SystemType : $("#inputSystemType").val(),
		SystemSerialNumber : $("#inputSystemSerialNumber").val(),
		SoftwareVersion : $("#inputSoftwareVersion").val(),
		RevisionLevel : $("#inputRevisionLevel").val(),
		Modality : $("#selectModality").val()
	};

	//console.log($scope);
	
	if ($scope.recordId == "" || !($scope.recordId > 0))
	{
		if ($scope.SystemType == "" || $scope.SystemSerialNumber == "" || $scope.SoftwareVersion == "" || $scope.RevisionLevel == "" || $scope.Modality == "")
		{
			$('#error-div').html('Please select all values.');
			showTimedElem('error-div');
			$('#error-div2').html('Please select all values.');
			showTimedElem('error-div2');
			//showLoading(false);
			return;
		}
	}


	if ($scope.controlPanelLayout == "" || $scope.modalityWorkListEmpty == "" || $scope.allSoftwareLoadedAndFunctioning == "" || $scope.nPDPresetsOnSystem == "" || $scope.hDDFreeOfPatientStudies == "" || $scope.demoImagesLoadedOnHardDrive == "" || $scope.systemPerformedAsExpected == "" || $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "" || $scope.ConfirmSystemHddEmptiedOfAllPatientStudies == "" || $scope.ConfirmModalityWorkListRemovedFromSystem == "") {
		$('#error-div').html('Please select all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please select all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ($scope.controlPanelLayout == "Control panel changed" && $scope.LayoutChangeExplain == "") {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ($scope.allSoftwareLoadedAndFunctioning == "No" && $scope.allSoftwareLoadedAndFunctioningReason == "") {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	if ($scope.wereAnyIssuesDiscoveredWithSystemDuringDemo == "Yes" && $scope.wasServiceContacted == "") {
		$('#error-div').html('Please fill all values.');
		showTimedElem('error-div');
		$('#error-div2').html('Please fill all values.');
		showTimedElem('error-div2');
		//showLoading(false);
		return;
	}

	var confirmMessage = 'Submit the status update?';
	if (isFinal == "Yes")
		confirmMessage = 'Do you want to submit a final status?\nPlease make sure.....';

	var sure = confirm(confirmMessage);
	
	
	if (sure) {
		
		//show saving animation
		$('#error-div2').text("").append(getLoadingMini());
		showTimedElem('error-div2');
	
		if ($scope.recordId != "" && parseInt($scope.recordId) > 0)
		{
			//showLoading(true);
			var _url =  serviceRootUrl + "svc.aspx?op=AddStatus&SPUrl=" + spwebRootUrl + "sites/busops&recordId=" + $scope.recordId + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=" + isFinal + "&authInfo=" + userInfoData.AuthenticationHeader;
			
			$.ajax({
				crossDomain: true,
				type:"GET",
				contentType: "application/json; charset=utf-8",
				async:true,
				url: _url,
				data: {},
				dataType: "jsonp",                
				jsonpCallback: "callbackSaveStatus"
			});
		}
		else 
		{
			var _url =  serviceRootUrl + "svc.aspx?op=AddNewStatus&SPUrl=" + spwebRootUrl + "sites/busops&SerialNumber=" + $scope.SystemSerialNumber + "&SoftwareVersion=" + $scope.SoftwareVersion + "&RevisionLevel=" + $scope.RevisionLevel + "&SystemType=" + $scope.SystemType + "&Modality=" + $scope.Modality + "&ControlPanelLayout=" + $scope.controlPanelLayout + "&ModalityWorkListEmpty=" + $scope.modalityWorkListEmpty + "&AllSoftwareLoadedAndFunctioning=" + $scope.allSoftwareLoadedAndFunctioning + "&IfNoExplain=" + $scope.allSoftwareLoadedAndFunctioningReason + "&NPDPresetsOnSystem=" + $scope.nPDPresetsOnSystem + "&HDDFreeOfPatientStudies=" + $scope.hDDFreeOfPatientStudies + "&DemoImagesLoadedOnHardDrive=" + $scope.demoImagesLoadedOnHardDrive + "&SystemPerformedAsExpected=" + $scope.systemPerformedAsExpected + "&AnyIssuesDuringDemo=" + $scope.wereAnyIssuesDiscoveredWithSystemDuringDemo + "&wasServiceContacted=" + $scope.wasServiceContacted + "&ConfirmModalityWorkListRemoved=" + $scope.ConfirmModalityWorkListRemovedFromSystem + "&ConfirmSystemHDDEmptied=" + $scope.ConfirmSystemHddEmptiedOfAllPatientStudies + "&LayoutChangeExplain=" + $scope.LayoutChangeExplain + "&Comments=" + $scope.Comments + "&WorkPhone=" + $scope.userInfo.WorkPhone + "&SystemPerformedNotAsExpectedExplain=" + $scope.systemPerformedNotAsExpectedExplain + "&IsFinal=No&authInfo=" + userInfoData.AuthenticationHeader;
			
			$.ajax({
				crossDomain: true,
				type:"GET",
				contentType: "application/json; charset=utf-8",
				async:true,
				url: _url,
				data: {},
				dataType: "jsonp",                
				jsonpCallback: "callbackSaveStatus"
			});
		}
	}
}

function callbackSaveStatus(data)
{
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





/******************* Redirect Page ***********************/
$( document ).on( "pagebeforeshow", "#pgRedirect", function(event) {
	if ($.urlParam("url"))
	{
		NavigatePage(decodeURIComponent($.urlParam("url")));
	}
});


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
					$("#searchCatalogs").val(result.text);
					navigator.notification.vibrate(15);
					
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






