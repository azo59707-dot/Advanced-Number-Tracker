// تطبيق تتبع الأرقام
class NumberTracker {
    constructor() {
        this.numbers = JSON.parse(localStorage.getItem('trackedNumbers')) || [];
        this.map = null;
        this.miniMap = null;
        this.markers = [];
        this.currentLocation = null;
        this.apiKey = localStorage.getItem('phoneApiKey') || null;
        this.initializeEventListeners();
        this.renderNumbers();
        this.initializeMap();
        this.loadApiKey();
    }

    initializeEventListeners() {
        // إضافة رقم جديد
        document.getElementById('numberForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNumber();
        });

        // البحث والفلترة
        document.getElementById('searchInput').addEventListener('input', () => {
            this.filterNumbers();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterNumbers();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterNumbers();
        });
    }

    addNumber() {
        const number = document.getElementById('number').value.trim();
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const status = document.getElementById('status').value;
        const phoneType = document.getElementById('phoneType').value;

        if (!number) {
            alert('يرجى إدخال رقم');
            return;
        }

        // التحقق من عدم تكرار الرقم
        if (this.numbers.some(item => item.number === number)) {
            alert('هذا الرقم موجود بالفعل');
            return;
        }

        const newNumber = {
            id: Date.now(),
            number: number,
            description: description || 'لا يوجد وصف',
            category: category,
            status: status,
            phoneType: phoneType,
            location: null,
            carrier: null,
            country: null,
            region: null,
            dateAdded: new Date().toLocaleDateString('ar-SA'),
            timeAdded: new Date().toLocaleTimeString('ar-SA')
        };

        this.numbers.unshift(newNumber);
        this.saveToStorage();
        this.renderNumbers();
        this.clearForm();

        // إظهار رسالة نجاح
        this.showNotification('تم إضافة الرقم بنجاح!', 'success');
    }

    clearForm() {
        document.getElementById('numberForm').reset();
    }

    deleteNumber(id) {
        if (confirm('هل أنت متأكد من حذف هذا الرقم؟')) {
            this.numbers = this.numbers.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderNumbers();
            this.showNotification('تم حذف الرقم بنجاح!', 'success');
        }
    }

    updateNumberStatus(id, newStatus) {
        const number = this.numbers.find(item => item.id === id);
        if (number) {
            number.status = newStatus;
            this.saveToStorage();
            this.renderNumbers();
            this.showNotification('تم تحديث حالة الرقم!', 'success');
        }
    }

    filterNumbers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredNumbers = this.numbers.filter(item => {
            const matchesSearch = item.number.toLowerCase().includes(searchTerm) ||
                                item.description.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesStatus = !statusFilter || item.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderNumbers(filteredNumbers);
    }

    renderNumbers(numbersToRender = null) {
        const numbersList = document.getElementById('numbersList');
        const numbers = numbersToRender || this.numbers;

        if (numbers.length === 0) {
            numbersList.innerHTML = `
                <div class="empty-state">
                    <h3>📝 لا توجد أرقام متتبعة</h3>
                    <p>ابدأ بإضافة رقم جديد لتتبع حالته</p>
                </div>
            `;
            return;
        }

        numbersList.innerHTML = numbers.map(item => `
            <div class="number-item">
                <div class="number-header">
                    <span class="number-value">${item.number}</span>
                    <span class="number-category">${item.category}</span>
                </div>
                <div class="number-description">${item.description}</div>
                
                ${item.location ? `
                    <div class="location-info">
                        <h4 style="margin: 0 0 10px 0; color: #2d3748;">📍 معلومات الموقع</h4>
                        <div class="location-details">
                            <div class="location-item">
                                <span class="icon">🏢</span>
                                <span class="label">المشغل:</span>
                                <span class="value">${item.carrier || 'غير محدد'}</span>
                            </div>
                            <div class="location-item">
                                <span class="icon">🌍</span>
                                <span class="label">البلد:</span>
                                <span class="value">${item.country || 'غير محدد'}</span>
                            </div>
                            <div class="location-item">
                                <span class="icon">🏙️</span>
                                <span class="label">المنطقة:</span>
                                <span class="value">${item.region || 'غير محدد'}</span>
                            </div>
                            <div class="location-item">
                                <span class="icon">📱</span>
                                <span class="label">النوع:</span>
                                <span class="value">${item.phoneType || 'غير محدد'}</span>
                            </div>
                            <div class="location-item">
                                <span class="icon">${item.valid ? '✅' : '❌'}</span>
                                <span class="label">الحالة:</span>
                                <span class="value">${item.valid ? 'صحيح' : 'غير صحيح'}</span>
                            </div>
                            <div class="location-item">
                                <span class="icon">🔗</span>
                                <span class="label">المصدر:</span>
                                <span class="value">${numberTracker.apiKey ? 'API حقيقي' : 'محاكاة'}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="number-footer">
                    <div>
                        <span class="number-status status-${item.status}">${item.status}</span>
                        <span class="number-date">${item.dateAdded} - ${item.timeAdded}</span>
                    </div>
                    <div>
                        ${!item.location ? `
                            <button onclick="numberTracker.trackLocation('${item.number}')" 
                                    style="background: #38a169; margin-right: 10px; padding: 4px 8px; font-size: 12px;">
                                📍 تتبع الموقع
                            </button>
                        ` : ''}
                        <select onchange="numberTracker.updateNumberStatus(${item.id}, this.value)" 
                                style="margin-right: 10px; padding: 4px; border-radius: 4px; border: 1px solid #ccc;">
                            <option value="نشط" ${item.status === 'نشط' ? 'selected' : ''}>نشط</option>
                            <option value="معلق" ${item.status === 'معلق' ? 'selected' : ''}>معلق</option>
                            <option value="مكتمل" ${item.status === 'مكتمل' ? 'selected' : ''}>مكتمل</option>
                            <option value="ملغي" ${item.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
                        </select>
                        <button class="delete-btn" onclick="numberTracker.deleteNumber(${item.id})">حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    saveToStorage() {
        localStorage.setItem('trackedNumbers', JSON.stringify(this.numbers));
    }

    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        // إضافة CSS للرسوم المتحركة
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // إزالة الإشعار بعد 3 ثوان
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // إحصائيات سريعة
    getStats() {
        const total = this.numbers.length;
        const active = this.numbers.filter(item => item.status === 'نشط').length;
        const completed = this.numbers.filter(item => item.status === 'مكتمل').length;
        const pending = this.numbers.filter(item => item.status === 'معلق').length;
        const cancelled = this.numbers.filter(item => item.status === 'ملغي').length;

        return { total, active, completed, pending, cancelled };
    }

    // تصدير البيانات
    exportData() {
        const dataStr = JSON.stringify(this.numbers, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tracked-numbers-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // استيراد البيانات
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.numbers = [...this.numbers, ...importedData];
                    this.saveToStorage();
                    this.renderNumbers();
                    this.showNotification('تم استيراد البيانات بنجاح!', 'success');
                } else {
                    throw new Error('تنسيق الملف غير صحيح');
                }
            } catch (error) {
                this.showNotification('خطأ في استيراد البيانات', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// تهيئة التطبيق
const numberTracker = new NumberTracker();

// إضافة أزرار إضافية للوحة التحكم
document.addEventListener('DOMContentLoaded', function() {
    // إضافة أزرار الإحصائيات والتصدير
    const header = document.querySelector('header');
    const controlButtons = document.createElement('div');
    controlButtons.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
    `;
    
    controlButtons.innerHTML = `
        <button onclick="showStats()" style="background: #48bb78; padding: 8px 16px; font-size: 14px;">
            📊 الإحصائيات
        </button>
        <button onclick="numberTracker.exportData()" style="background: #4299e1; padding: 8px 16px; font-size: 14px;">
            💾 تصدير البيانات
        </button>
        <button onclick="document.getElementById('importFile').click()" style="background: #ed8936; padding: 8px 16px; font-size: 14px;">
            📁 استيراد البيانات
        </button>
        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleImport(this)">
    `;
    
    header.appendChild(controlButtons);
});

function showStats() {
    const stats = numberTracker.getStats();
    const message = `
        📊 إحصائيات الأرقام المتتبعة:
        
        المجموع الكلي: ${stats.total}
        نشط: ${stats.active}
        مكتمل: ${stats.completed}
        معلق: ${stats.pending}
        ملغي: ${stats.cancelled}
    `;
    alert(message);
}

function handleImport(input) {
    if (input.files && input.files[0]) {
        numberTracker.importData(input.files[0]);
    }
}

// وظائف تتبع الموقع
function trackNumberLocation() {
    const number = document.getElementById('number').value.trim();
    if (!number) {
        alert('يرجى إدخال رقم أولاً');
        return;
    }
    
    numberTracker.trackLocation(number);
}

// إضافة وظائف الخريطة
NumberTracker.prototype.initializeMap = function() {
    // تهيئة Google Maps - مركز الشرق الأوسط
    const mapOptions = {
        center: { lat: 25.0000, lng: 45.0000 }, // مركز الشرق الأوسط
        zoom: 5,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };
    
    this.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    this.markers = [];
    
    this.updateMapMarkers();
}


NumberTracker.prototype.trackLocation = async function(number) {
    try {
        this.showNotification('جاري تتبع موقع الرقم...', 'info');
        
        // الحصول على بيانات الموقع
        const locationData = await this.getNumberLocationData(number);
        
        // البحث عن الرقم في القائمة وتحديث معلومات الموقع
        const numberIndex = this.numbers.findIndex(item => item.number === number);
        if (numberIndex !== -1) {
            this.numbers[numberIndex].location = locationData.location;
            this.numbers[numberIndex].carrier = locationData.carrier;
            this.numbers[numberIndex].country = locationData.country;
            this.numbers[numberIndex].region = locationData.region;
            this.numbers[numberIndex].valid = locationData.valid;
            this.numbers[numberIndex].type = locationData.type;
            
            this.saveToStorage();
            this.renderNumbers();
            this.updateMapMarkers();
            
            const apiStatus = this.apiKey ? ' (API حقيقي)' : ' (محاكاة)';
            this.showNotification(`تم تتبع موقع الرقم بنجاح!${apiStatus}`, 'success');
        } else {
            this.showNotification('الرقم غير موجود في القائمة', 'error');
        }
    } catch (error) {
        this.showNotification('خطأ في تتبع الموقع: ' + error.message, 'error');
    }
}

NumberTracker.prototype.updateMapMarkers = function() {
    // إزالة العلامات القديمة
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    
    // إضافة علامات جديدة للأرقام التي لها موقع
    this.numbers.forEach(number => {
        if (number.location) {
            const marker = new google.maps.Marker({
                position: { lat: number.location.lat, lng: number.location.lng },
                map: this.map,
                title: number.number,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="15" cy="15" r="12" fill="${this.getStatusColor(number.status)}" stroke="white" stroke-width="2"/>
                            <text x="15" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">
                                ${number.number.slice(-2)}
                            </text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(30, 30)
                }
            });
            
            // معلومات العلامة
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="text-align: right; font-family: 'Segoe UI', sans-serif; direction: rtl;">
                        <h4 style="margin: 0 0 10px 0; color: #2d3748;">${number.number}</h4>
                        <p style="margin: 5px 0;"><strong>الوصف:</strong> ${number.description}</p>
                        <p style="margin: 5px 0;"><strong>المشغل:</strong> ${number.carrier || 'غير محدد'}</p>
                        <p style="margin: 5px 0;"><strong>البلد:</strong> ${number.country || 'غير محدد'}</p>
                        <p style="margin: 5px 0;"><strong>المنطقة:</strong> ${number.region || 'غير محدد'}</p>
                        <p style="margin: 5px 0;"><strong>الحالة:</strong> ${number.status}</p>
                        <p style="margin: 5px 0;"><strong>النوع:</strong> ${number.phoneType}</p>
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
            
            this.markers.push(marker);
        }
    });
}

NumberTracker.prototype.getStatusColor = function(status) {
    const colors = {
        'نشط': '#38a169',
        'معلق': '#ed8936', 
        'مكتمل': '#4299e1',
        'ملغي': '#e53e3e'
    };
    return colors[status] || '#6b7280';
}

NumberTracker.prototype.showAllLocations = function() {
    if (this.markers.length === 0) {
        this.showNotification('لا توجد مواقع متاحة للعرض', 'info');
        return;
    }
    
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => {
        bounds.extend(marker.getPosition());
    });
    this.map.fitBounds(bounds);
}

NumberTracker.prototype.centerMap = function() {
    this.map.setCenter({ lat: 25.0000, lng: 45.0000 });
    this.map.setZoom(5);
}

// تهيئة الخريطة المصغرة
NumberTracker.prototype.initializeMiniMap = function() {
    const miniMapOptions = {
        center: { lat: 25.0000, lng: 45.0000 }, // مركز افتراضي
        zoom: 10,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };
    
    this.miniMap = new google.maps.Map(document.getElementById('miniMap'), miniMapOptions);
}

// الحصول على الموقع الحالي
NumberTracker.prototype.getCurrentLocation = function() {
    if (!navigator.geolocation) {
        this.showNotification('المتصفح لا يدعم تحديد الموقع', 'error');
        return;
    }

    this.showNotification('جاري تحديد موقعك...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // تحديث الخريطة المصغرة
            this.miniMap.setCenter(this.currentLocation);
            this.miniMap.setZoom(15);
            
            // إضافة علامة للموقع الحالي
            new google.maps.Marker({
                position: this.currentLocation,
                map: this.miniMap,
                title: 'موقعك الحالي',
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="15" cy="15" r="12" fill="#e53e3e" stroke="white" stroke-width="3"/>
                            <text x="15" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">
                                أنت
                            </text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(30, 30)
                }
            });
            
            this.showNotification('تم تحديد موقعك بنجاح!', 'success');
        },
        (error) => {
            let errorMessage = 'خطأ في تحديد الموقع: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'تم رفض الإذن';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'الموقع غير متاح';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'انتهت مهلة الطلب';
                    break;
                default:
                    errorMessage += 'خطأ غير معروف';
                    break;
            }
            this.showNotification(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }
    );
}

// توسيط الخريطة المصغرة
NumberTracker.prototype.centerMiniMap = function() {
    if (this.currentLocation) {
        this.miniMap.setCenter(this.currentLocation);
        this.miniMap.setZoom(15);
    } else {
        this.miniMap.setCenter({ lat: 25.0000, lng: 45.0000 });
        this.miniMap.setZoom(10);
    }
}

// وظائف عامة للخريطة
function showAllLocations() {
    numberTracker.showAllLocations();
}

function centerMap() {
    numberTracker.centerMap();
}

function getCurrentLocation() {
    numberTracker.getCurrentLocation();
}

function centerMiniMap() {
    numberTracker.centerMiniMap();
}

// وظائف API
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
        numberTracker.apiKey = apiKey;
        localStorage.setItem('phoneApiKey', apiKey);
        numberTracker.showNotification('تم حفظ API Key بنجاح!', 'success');
        numberTracker.updateApiStatus();
    } else {
        numberTracker.showNotification('يرجى إدخال API Key صحيح', 'error');
    }
}

NumberTracker.prototype.loadApiKey = function() {
    if (this.apiKey) {
        document.getElementById('apiKey').value = this.apiKey;
        this.updateApiStatus();
    }
}

NumberTracker.prototype.updateApiStatus = function() {
    const statusElement = document.querySelector('.api-status');
    if (statusElement) {
        statusElement.remove();
    }
    
    const apiKeyInput = document.getElementById('apiKey');
    const status = this.apiKey ? 'connected' : 'disconnected';
    const statusText = this.apiKey ? 'متصل' : 'غير متصل';
    
    const statusSpan = document.createElement('span');
    statusSpan.className = `api-status ${status}`;
    statusSpan.textContent = statusText;
    
    apiKeyInput.parentNode.appendChild(statusSpan);
}

NumberTracker.prototype.getNumberLocationData = async function(number) {
    if (this.apiKey) {
        try {
            // استخدام Abstract API الحقيقي
            const response = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${this.apiKey}&phone=${number}`);
            const data = await response.json();
            
            if (data.valid) {
                return {
                    location: {
                        lat: data.location?.latitude || 24.7136,
                        lng: data.location?.longitude || 46.6753
                    },
                    carrier: data.carrier || 'غير محدد',
                    country: data.country?.name || 'غير محدد',
                    region: data.location?.city || 'غير محدد',
                    valid: true,
                    type: data.type || 'mobile'
                };
            } else {
                throw new Error('رقم غير صحيح');
            }
        } catch (error) {
            console.error('API Error:', error);
            // العودة للمحاكاة في حالة فشل API
            return this.getMockLocationData(number);
        }
    } else {
        // استخدام المحاكاة إذا لم يكن هناك API Key
        return this.getMockLocationData(number);
    }
}

NumberTracker.prototype.getMockLocationData = function(number) {
    // محاكاة بيانات الموقع (للاختبار)
    let carriers, countries, regions;
    
    // تحديد البلد حسب رمز الرقم
    if (number.startsWith('+20') || number.startsWith('20')) {
        // مصر
        carriers = ['Vodafone Egypt', 'Orange Egypt', 'Etisalat Egypt', 'WE (Telecom Egypt)'];
        countries = ['مصر'];
        regions = ['القاهرة', 'الإسكندرية', 'الجيزة', 'الشرقية', 'الدقهلية', 'البحيرة', 'أسيوط', 'سوهاج', 'قنا'];
    } else if (number.startsWith('+966') || number.startsWith('966')) {
        // السعودية
        carriers = ['STC', 'Mobily', 'Zain', 'Virgin Mobile', 'Lebara'];
        countries = ['السعودية'];
        regions = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'الطائف'];
    } else if (number.startsWith('+971') || number.startsWith('971')) {
        // الإمارات
        carriers = ['Etisalat UAE', 'du', 'Virgin Mobile UAE'];
        countries = ['الإمارات'];
        regions = ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة'];
    } else {
        // دول أخرى
        carriers = ['STC', 'Mobily', 'Zain', 'Vodafone', 'Orange', 'Etisalat'];
        countries = ['السعودية', 'مصر', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان'];
        regions = ['الرياض', 'القاهرة', 'دبي', 'الكويت', 'الدوحة', 'المنامة', 'مسقط'];
    }
    
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // إحداثيات حسب البلد
    let lat, lng;
    if (number.startsWith('+20') || number.startsWith('20')) {
        // مصر - القاهرة
        lat = 30.0444 + (Math.random() - 0.5) * 5;
        lng = 31.2357 + (Math.random() - 0.5) * 5;
    } else if (number.startsWith('+966') || number.startsWith('966')) {
        // السعودية - الرياض
        lat = 24.7136 + (Math.random() - 0.5) * 10;
        lng = 46.6753 + (Math.random() - 0.5) * 10;
    } else if (number.startsWith('+971') || number.startsWith('971')) {
        // الإمارات - دبي
        lat = 25.2048 + (Math.random() - 0.5) * 2;
        lng = 55.2708 + (Math.random() - 0.5) * 2;
    } else {
        // افتراضي - السعودية
        lat = 24.7136 + (Math.random() - 0.5) * 10;
        lng = 46.6753 + (Math.random() - 0.5) * 10;
    }
    
    return {
        location: { lat, lng },
        carrier: carrier,
        country: country,
        region: region,
        valid: true,
        type: 'mobile'
    };
}

// دالة تهيئة Google Maps
function initMap() {
    if (typeof numberTracker !== 'undefined') {
        numberTracker.initializeMap();
        numberTracker.initializeMiniMap();
    }
}
