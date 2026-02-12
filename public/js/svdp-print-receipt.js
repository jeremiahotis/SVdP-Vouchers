/**
 * Shared Print Receipt Logic
 * Handles modal generation and printing for both Frontend and Admin contexts.
 */
(function (window, $) {
    'use strict';

    window.SVDP_PrintReceipt = {

        currentLang: 'en',
        data: null,

        translations: {
            en: {
                subtitle: 'Voucher Receipt', // Will be dynamic
                issuedTo: 'Issued To:',
                date: 'Expires On:', // Swapped
                types: 'Voucher Type:',
                totalAdults: 'Total Adults:',
                totalChildren: 'Total Children:',
                itemsAdult: 'Total Allowed Items (Adults):',
                itemsChild: 'Total Allowed Items (Children):',
                instructionsTitle: 'Redemption Instructions',
                instructionsText: 'Please present this receipt and your date of birth at the checkout counter.',
                address: 'Address:',
                hours: 'Hours:',
                expires: 'Issued on:', // Swapped
                footer: 'Thank you for shopping with SVdP!',
                new: 'New',
                daysFromIssue: '30 days from issue',
                issuedBy: 'Issued by:'
            },
            es: {
                subtitle: 'Recibo del Vale', // Will be dynamic
                issuedTo: 'Emitido a:',
                date: 'Vence el:', // Swapped
                types: 'Tipo de Vale:',
                totalAdults: 'Total Adultos:',
                totalChildren: 'Total Niños:',
                itemsAdult: 'Total Artículos Permitidos (Adultos):',
                itemsChild: 'Total Artículos Permitidos (Niños):',
                instructionsTitle: 'Instrucciones de Canje',
                instructionsText: 'Por favor presente este recibo y su fecha de nacimiento en la caja.',
                address: 'Dirección:',
                hours: 'Horario:',
                expires: 'Emitido el:', // Swapped
                footer: '¡Gracias por comprar con SVdP!',
                new: 'Nuevo',
                daysFromIssue: '30 días desde la emisión',
                issuedBy: 'Emitido por:'
            },
            my: { // Burmese
                subtitle: 'ဘောက်ချာပြေစာ',
                issuedTo: 'လက်ခံသူ -',
                date: 'သက်တမ်းကုန်ဆုံးမည့်ရက် -',
                types: 'ဘောက်ချာအမျိုးအစား -',
                totalAdults: 'လူကြီးစုစုပေါင်း -',
                totalChildren: 'ကလေးစုစုပေါင်း -',
                itemsAdult: 'လူကြီးတစ်ဦးချင်းစီအတွက် ခွင့်ပြုထားသောပစ္စည်း -',
                itemsChild: 'ကလေးတစ်ဦးချင်းစီအတွက် ခွင့်ပြုထားသောပစ္စည်း -',
                instructionsTitle: 'လဲလှယ်ရန် ညွှန်ကြားချက်များ',
                instructionsText: 'ငွေရှင်းကောင်တာတွင် ဤပြေစာနှင့် သင့်မွေးသက္ကရာဇ်ကို ပြပါ။',
                address: 'လိပ်စာ -',
                hours: 'ဆိုင်ဖွင့်ချိန် -',
                expires: 'ထုတ်ပေးသည့်ရက် -',
                footer: 'SVdP တွင် ဈေးဝယ်အားပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။',
                new: 'အသစ်',
                daysFromIssue: 'ထုတ်ပေးသည့်နေ့မှ ရက်ပေါင်း ၃၀',
                issuedBy: 'ထုတ်ပေးသူ -'
            }
        },

        /**
         * Initialize the modal if it doesn't exist
         */
        init: function () {
            if ($('#svdp-print-modal').length === 0) {
                $('body').append(this.getModalTemplate());

                // Event listener to close modal
                $(document).on('click', '.svdp-print-modal-close, .svdp-print-modal-overlay', function (e) {
                    if (e.target === this) {
                        $('#svdp-print-modal').hide();
                    }
                });

                // Print button action
                $(document).on('click', '.svdp-print-action-button', function () {
                    window.print();
                });

                // Language toggle action
                $(document).on('click', '.svdp-lang-btn', (e) => {
                    const lang = $(e.target).data('lang');
                    this.setLanguage(lang);
                });
            }
        },

        /**
         * Show the print modal with data
         * @param {Object} data Voucher data
         */
        showModal: function (data) {
            this.init();
            this.data = data; // Store data for re-rendering on lang switch
            this.currentLang = 'en'; // Reset to English default
            this.updateUI();
            $('#svdp-print-modal').css('display', 'flex');
        },

        setLanguage: function (lang) {
            this.currentLang = lang;
            this.updateUI();
        },

        updateUI: function () {
            if (!this.data) return;
            const t = this.translations[this.currentLang] || this.translations['en'];
            const data = this.data;
            const $modal = $('#svdp-print-modal');

            // Active toggle state
            $('.svdp-lang-btn').removeClass('active');
            $(`.svdp-lang-btn[data-lang="${this.currentLang}"]`).addClass('active');

            // Static Labels - Org Name Hardcoded

            // Dynamic Title based on Type
            let typesArr = [];
            if (Array.isArray(data.voucherType)) {
                typesArr = data.voucherType;
            } else if (typeof data.voucherType === 'string') {
                typesArr = data.voucherType.split(',');
            }

            let primaryType = typesArr.length > 0 ? typesArr[0].trim() : 'General';
            primaryType = primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
            let titleText = primaryType + ' ' + t.subtitle;
            $modal.find('.t-subtitle').text(titleText);

            $modal.find('.t-issuedTo').text(t.issuedTo);
            $modal.find('.t-date').text(t.date);
            $modal.find('.t-types').text(t.types);
            $modal.find('.t-totalAdults').text(t.totalAdults);
            $modal.find('.t-totalChildren').text(t.totalChildren);
            $modal.find('.t-itemsAdult').text(t.itemsAdult);
            $modal.find('.t-itemsChild').text(t.itemsChild);
            $modal.find('.t-instructionsTitle').text(t.instructionsTitle);
            $modal.find('.t-instructionsText').text(t.instructionsText);
            $modal.find('.t-address').text(t.address);
            $modal.find('.t-hours').text(t.hours);
            $modal.find('.t-expires').text(t.expires);
            $modal.find('.t-footer').text(t.footer);
            $modal.find('.t-issuedBy').text(t.issuedBy || 'Issued by:');

            // Dynamic Data
            $modal.find('.val-name').text(data.firstName + ' ' + data.lastName);
            $modal.find('.val-id').text(data.id ? '#' + data.id : t.new);

            // Item Breakdowns
            $modal.find('.val-adults').text(data.adults || 0);
            $modal.find('.val-children').text(data.children || 0);
            $modal.find('.val-items-adult').text(data.itemsAdult || 0);
            $modal.find('.val-items-child').text(data.itemsChildren || 0);

            // Types List
            let typesDisplay = typesArr.map(t => t.trim().charAt(0).toUpperCase() + t.trim().slice(1)).join(', ');
            $modal.find('.val-types').text(typesDisplay);

            // Store Info
            $modal.find('.val-store-hours').text(data.storeHours || '');
            $modal.find('.val-store-address').text(data.storeAddress || '');

            // Issuer Info
            if (data.issuedBy && data.issuedOrg) {
                let issuerText = `${data.issuedBy}, <span style="font-style: italic;">${data.issuedOrg}</span>`;
                $modal.find('.val-issuedBy').html(issuerText);
                $modal.find('.issuedRequestorRow').show();
            } else {
                $modal.find('.issuedRequestorRow').hide();
            }

            // DATE SWAP LOGIC
            const createdDate = new Date(data.voucherCreatedDate || Date.now());
            const expiresDate = new Date(createdDate);
            expiresDate.setDate(createdDate.getDate() + 30);

            $modal.find('.val-date').text(expiresDate.toLocaleDateString());
            $modal.find('.val-expires').text(createdDate.toLocaleDateString());
        },

        /**
         * Get the HTML template for the modal
         */
        getModalTemplate: function () {
            return `
            <div id="svdp-print-modal" class="svdp-print-modal-overlay" style="display: none;">
                <div class="svdp-print-modal">
                    <button class="svdp-print-modal-close">&times;</button>
                    
                    <div class="svdp-lang-toggle">
                        <button class="svdp-lang-btn active" data-lang="en">English</button>
                        <button class="svdp-lang-btn" data-lang="es">Español</button>
                        <button class="svdp-lang-btn" data-lang="my">Burmese</button>
                    </div>

                    <div class="svdp-receipt-content" id="svdp-receipt-boundary">
                        <header class="receipt-header">
                            <h1 class="t-title">Society of St. Vincent de Paul – Fort Wayne</h1>
                            <h2 class="t-subtitle">Voucher Receipt</h2>
                            <p class="receipt-id val-id"></p>
                        </header>
                        
                        <div class="receipt-body">
                            <div class="receipt-row">
                                <span class="label t-issuedTo">Issued To:</span>
                                <span class="value val-name"></span>
                            </div>
                            <div class="receipt-row">
                                <span class="label t-date">Expires On:</span>
                                <span class="value val-date"></span>
                            </div>
                             <div class="receipt-divider"></div>
                             
                            <div class="receipt-row">
                                <span class="label t-types">Voucher Type:</span>
                                <span class="value val-types"></span>
                            </div>
                            
                            <div class="receipt-divider"></div>

                            <div class="receipt-row highlight">
                                <span class="label t-totalAdults">Total Adults:</span>
                                <span class="value val-adults"></span>
                            </div>
                             <div class="receipt-row">
                                <span class="label t-itemsAdult">Total Allowed Items (Adults):</span>
                                <span class="value val-items-adult"></span>
                            </div>

                            <div class="receipt-divider-sub"></div>

                            <div class="receipt-row highlight">
                                <span class="label t-totalChildren">Total Children:</span>
                                <span class="value val-children"></span>
                            </div>
                            <div class="receipt-row">
                                <span class="label t-itemsChild">Total Allowed Items (Children):</span>
                                <span class="value val-items-child"></span>
                            </div>

                            <div class="receipt-divider"></div>
                            
                            <div class="receipt-info">
                                <h3 class="t-instructionsTitle">Redemption Instructions</h3>
                                <p class="t-instructionsText">Please present this receipt and your date of birth at the checkout counter.</p>
                                <p><strong class="t-address">Address:</strong> <span class="val-store-address"></span></p>
                                <p><strong class="t-hours">Hours:</strong> <span class="val-store-hours"></span></p>
                                <p class="expiry"><span class="t-expires">Issued on:</span> <span class="val-expires"></span></p>
                                <p class="issuedRequestorRow" style="margin-top: 5px; font-size: 13px;">
                                    <span class="t-issuedBy" style="font-weight: bold;">Issued by:</span> <span class="val-issuedBy"></span>
                                </p>
                            </div>
                        </div>
                        
                        <footer class="receipt-footer">
                            <p class="t-footer">Thank you for shopping with SVdP!</p>
                        </footer>
                    </div>

                    <div class="svdp-print-actions">
                        <button class="svdp-print-action-button">Print Receipt</button>
                    </div>
                </div>
            </div>
            `;
        }
    };

})(window, jQuery);
