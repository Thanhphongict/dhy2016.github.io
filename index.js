var overlaySrc = "img/ava1.png";

/*******************
    Raven configuration
*******************/
$(document).ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
    Raven.captureMessage(thrownError || jqXHR.statusText, {
        extra: {
            type: ajaxSettings.type,
            url: ajaxSettings.url,
            data: ajaxSettings.data,
            status: jqXHR.status,
            error: thrownError || jqXHR.statusText,
            response: jqXHR.responseText.substring(0, 100)
        }
    });
});

Raven.config('https://2c3a5ecc1b4846df92ee0362356bc587@sentry.io/99860', {
    whitelistUrls: [
        "/www\.thanhdoandanang\.org\.vn\/ava60nam\/",
        "/thanhdoandanang\.org\.vn\/ava60nam\/"
    ],
    ignoreUrls: [
        "/www\.thanhdoandanang\.org\.vn\/ava60nam\/libraries\/materialize\//",
        "/thanhdoandanang\.org\.vn\/ava60nam\/libraries\/materialize\//",
        "/connect\.facebook\.net/",
        "/graph\.facebook\.com/i"
    ]
}).install()

function ravenSetUserInfo(){
    Raven.setUserContext(FB.getAuthResponse())
}

/*******************
    Piwik configuration
*******************/
var _paq = _paq || [];
_paq.push(["setDomains", ["*.thanhdoandanang.org.vn/ava60nam"]]);
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
    var u="//analytics-tuankiet65.rhcloud.com/";
    _paq.push(['setTrackerUrl', u+'piwik.php']);
    _paq.push(['setSiteId', '4']);
    var d=document,
        g=d.createElement('script'),
        s=d.getElementsByTagName('script')[0];
    g.type='text/javascript';
    g.async=true;
    g.defer=true;
    g.src=u+'piwik.js';
    s.parentNode.insertBefore(g,s);
})();

/*******************
    Facebook JS SDK configuration
*******************/

// Async load the SDK
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/vi_VN/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

// Function to call after initialization
window.fbAsyncInit = function() {
    FB.init({
        appId: '1822723244631116',
        xfbml: false,
        version: 'v2.7',
        status: true,
        cookie: true,
    });
    $("#ava-load-facebook").attr("class", enableButton);
    $("#ava-load-facebook").tooltip("remove");
    $("#ava-save-facebook-modal-trigger").attr("class", enableButton);
    $("#ava-save-facebook-modal-trigger").tooltip("remove");
};

function isDisabled(element) {
    var classList = element.className.split(" ");
    for (i = 0; i < classList.length; i++)
        if (classList[i] == "disabled")
            return true;
    return false;
}

function enableButton(index, old) {
    var classList = old.split(" ");
    var result = "";
    for (i = 0; i < classList.length; i++)
        if (classList[i] != "disabled")
            result += classList[i] + " ";
    result += "waves-effect waves-light";
    return result;
}

$("#ava-load-facebook").on('click', function() {
    if (isDisabled(this))
        return false;
    $("#ava-load-facebook").prop("disabled", true);
    $("#ava-load-facebook").html("Đang đăng nhập...");
    FB.login(function(response) {
        if (response.status == "connected") {
            Materialize.toast("Đăng nhập thành công.", 5000);
            loadAvatarFromFacebook();
            ravenSetUserInfo();
        } else {
            Materialize.toast("Đăng nhập thất bại, vui lòng thử lại hoặc tự chọn avatar trong máy", 5000);
            console.log(response)
        }
    })
})

function loadAvatarFromFacebook() {
    $("#ava-load-facebook").html("Đang load ảnh...");
    FB.api("/me/picture", {
        redirect: false,
        width: 600,
        height: 600
    }, function(response) {
        $("#avatar-cropper").cropit("imageSrc", response.data.url);
    })
    trackEvent("load-avatar", "facebook");
}

$("#avatar-cropper").cropit({
    width: 400,
    height: 400,
    minZoom: "fill",
    maxZoom: 2,
    freeMove: true,
    smallImage: "stretch",
    exportZoom: 1.5,
    onImageLoaded: function(){
        $("#direction-wrapper").hide();
        $("#ava-load-facebook").prop("disabled", false);
        $("#ava-load-facebook").html("<i class=\"fa fa-facebook-official\"></i> Lấy avatar từ Facebook");
    },
    onImageError: function(err, num, msg){
        Materialize.toast("Load ảnh thất bại.", 5000);
        throw new Error(msg);
    }
});

$("#ava-load-local").on('click', function() {
    trackEvent("load-avatar", "local");
    $(".cropit-image-input").click();
});

function imgExport(func) {
    var image = new Image();
    image.src = $("#avatar-cropper").cropit('export', {
        type: "image/png"
    });

    image.onload = function(){
        var overlay = new Image();
        overlay.src = overlaySrc;

        overlay.onload = function(){
            var canvas = document.createElement("canvas");
            canvas.setAttribute("width", 600);
            canvas.setAttribute("height", 600);

            var canvasContext = canvas.getContext("2d", {
                "alpha": false
            });

            canvasContext.fillStyle = "#fff",
            canvasContext.fillRect(0, 0, 600, 600);

            canvasContext.drawImage(image, 0, 0);
            canvasContext.drawImage(overlay, 0, 0);

            func(canvas.toDataURL("image/png"));
        }
    }
}

$("#ava-save-local").on("click", function() {
    if (typeof $("#avatar-cropper").cropit("export") == "undefined"){
        Materialize.toast("Bạn phải chọn ảnh trước khi lưu avatar về máy.", 5000);
        return;
    }
    $("#ava-save-local").prop("disabled", true);
    $("#ava-save-local").html("Đang xuất ảnh...");
    trackEvent("save-avatar", "local");
    filename = "TD60 - " + Date.now().toString() + ".png";
    imgExport(function(data){
        if (needToFallback()){
            // Some browsers doesn't support downloading file, so just open a modal
            // containing the image and let the users save it themselves
            $("#fallback-save-result").prop("src", data)
            $("#fallback-save-modal").openModal();
        } else {
            download(data, filename, "image/png");
        }
        $("#ava-save-local").prop("disabled", false);
        $("#ava-save-local").html("<i class=\"fa fa-download\"></i> Lưu avatar về máy");
    })
})

$("#ava-save-facebook").on("click", function() {
    trackEvent("save-avatar", "facebook");
    $("#ava-save-facebook-progress").show();
    $("#ava-save-facebook-progress div").show();
    $("#status").text("Đang đăng nhập...");
    FB.login(function(response) {
        if (response.status == "connected") {
            $("#status").text("Đang tạo album...");
            FB.api("/me/albums", "POST", {
                name: "TD60",
                privacy: {
                    value: "EVERYONE"
                },

                is_default: true
            }, function(response) {
                if (typeof response.error != "undefined"){
                    if (response.error.type == "OAuthException" &&
                        (response.error.code == 200 || response.error.code == 10)) {
                        $("#ava-save-facebook-progress div").hide();
                        $("#status").html("Bạn phải đồng ý cho phép ứng dụng đăng lên Facebook của bạn.<br />\
                                           Hãy nhấn OK để đăng nhập lại và cấp quyền cho ứng dụng.");
                        return;
                    } else {
                        throw new Error("Error: "+JSON.stringify(response));
                    }
                }
                
                $("#status").text("Đang đăng ảnh...");

                album_id = response.id;

                access_token = FB.getAuthResponse().accessToken;

                data = new FormData();
                data.append("message", "");
                data.append("no_story", "true");
                data.append("access_token", access_token);
                imgExport(function(imgData){
                    data.append("source", dataURItoBlob(imgData));
                    $.ajax({
                        url: "https://graph.facebook.com/" + album_id + "/photos",
                        data: data,
                        cache: false,
                        contentType: false,
                        processData: false,
                        type: "POST",
                        dataType: "json",
                        success: function(resp) {
                            trackEvent("save-avatar", "facebook-success");
                            $("#ava-save-facebook-progress div").hide();
                            $("#status").text("Đã đăng ảnh, bạn sẽ được chuyển tới trong giây lát...");
                            setTimeout(function(id){
                                window.location = "https://facebook.com/photo.php?fbid="+id; 
                            }, 1000, resp.id)
                            
                        },
                        error: function(resp) {
                            $("#ava-save-facebook-progress div").hide();
                            $("#status").text("Đã gặp lỗi: "+JSON.stringify(resp));
                            throw new Error(JSON.stringify(resp));
                        }
                    })
                })
            })
        } else {
            $("#ava-save-facebook-progress div").hide();
            $("#status").text("Đăng nhập thất bại, hãy thử lại.");
        }
    }, {
        scope: "publish_actions,user_photos"
    })
})

/* https://stackoverflow.com/questions/12168909/blob-from-dataurl */
function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    try {
        return new Blob([ab], {
            type: mimeString
        });
    } catch (e){
        // Fallback for browser that do not support Blob constructor:
        // ex: UC Browser
        blobBuilder = window.BlobBuilder || window.WebKitBlobBuilder ||
                      window.MozBlobBuilder || window.MSBlobBuilder;
        var blob = new blobBuilder();
        blob.append(ab);
        return blob.getBlob(mimeString);
    }
}

$("#cropit-rotate-right").on("click", function() {
    $("#avatar-cropper").cropit("rotateCW")
})

$("#cropit-rotate-left").on("click", function() {
    $("#avatar-cropper").cropit("rotateCCW")
})

$("#ava-save-facebook-modal-trigger").on("click", function(){
    if (isDisabled(this))
        return;
    if (typeof $("#avatar-cropper").cropit("export") == "undefined"){
        Materialize.toast("Bạn phải chọn ảnh trước khi đăng avatar lên Facebook.", 5000);
        return;
    }
    $("#ava-save-facebook-progress").hide();
    $("#ava-save-facebook-modal").openModal();
})

$('.button-collapse').sideNav();


$(".ava-choice").on("click", function(){
    overlayNum = $(this).data("overlay-id");
    overlaySrc = "img/ava"+overlayNum+".png";
    $("#overlay").prop("src", overlaySrc);
    $("#ava-choose-overlay-modal").closeModal();
    trackEvent("overlay", overlayNum);
})

$(function(){
    setTimeout(function(){
        $("#ava-choose-overlay-modal").openModal();
    }, 250);
})

function needToFallback(){
    // Detect if the app should download or open a modal containing the image
    // and let the user download themselves
    // Target:
    //  - UC Browser
    //  - Safari on iOS
    //  - IE Mobile / Edge Mobile
    return (/iPad|iPhone|iPod|UCBrowser|Windows Phone|IEMobile/.test(navigator.userAgent))
}

$("#ava-choose-overlay-trigger").leanModal();

function trackEvent(name, param){
    _paq.push(["trackEvent", name, param]);
    // TODO: Facebook App Events
}