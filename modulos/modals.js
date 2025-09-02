export function customAlert(message, callback, showReportBug = true) {
    return new Promise((resolve) => {
        const overlay = new bootstrap.Modal(document.getElementById("modal-alert"));
        const messageElement = document.getElementById("modal-alert-label");
        const okButton = document.getElementById("btn-alert-ok");
        //const reportBug = document.getElementById("report-bug");

        messageElement.innerHTML = message;

        document.getElementById("div-fundo").style.display = "flex";
        document.getElementById("div-carregando").style.display = "none";

        overlay.show();

        const fundoBootstrap = document.getElementById("modal-backdrop");
        if(fundoBootstrap) fundoBootstrap.style.display = "none"

        /* if(showReportBug) {
            reportBug.style.display = "block";
        } else {
            reportBug.style.display = "none";
        }

        reportBug.onclick = () => {
            customBugReport();
            overlay.hide();
        }; */

        okButton.onclick = () => {
            document.getElementById("div-fundo").style.display = "none";
            overlay.hide(); 
            console.log(callback)
            if (callback) callback(); 
            resolve();
        };
    });
}

export function customConfirm(message) {
    return new Promise((resolve) => {
        const overlay = new bootstrap.Modal(document.getElementById("modal-confirm"));
        const messageElement = document.getElementById("modal-confirm-label");
        const yesButton = document.getElementById("btn-confirm-sim");
        const noButton = document.getElementById("btn-confirm-nao");

        messageElement.textContent = message;

        document.getElementById("div-fundo").style.display = "flex"

        overlay.show();

        yesButton.onclick = () => {
            document.getElementById("div-fundo").style.display = "none";
            overlay.hide();
            resolve(true); 
        };

        noButton.onclick = () => {
            document.getElementById("div-fundo").style.display = "none";
            overlay.hide();
            resolve(false); 
        };
    });
}

export function customToast(message) {
    const toast = document.querySelector('.bs-toast.toast');
    if (!toast) return;

    const toastBody = toast.querySelector('.toast-body');
    if (toastBody) toastBody.textContent = message;

    const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
    bsToast.show();
}