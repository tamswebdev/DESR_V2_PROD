
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

/*
var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}
*/