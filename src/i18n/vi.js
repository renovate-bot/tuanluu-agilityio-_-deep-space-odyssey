// Vietnamese strings. English is the source language: every key here is the exact English string used in the code.
// Brand and ship names (DEEP SPACE ODYSSEY, ODYSSEY-01) and invented proper names stay untranslated on purpose.

export const VI = {
  // loading
  INITIALISING: 'ĐANG KHỞI TẠO',
  'STARTING RENDERER': 'KHỞI ĐỘNG BỘ DỰNG HÌNH',
  'CHARTING STARFIELD': 'LẬP BẢN ĐỒ SAO',
  'BUILDING ODYSSEY-01': 'DỰNG TÀU ODYSSEY-01',
  'FITTING OBSERVATION DECK': 'LẮP KHOANG QUAN SÁT',
  'IGNITING NEBULA': 'THẮP SÁNG TINH VÂN',
  'CALIBRATING OPTICS': 'HIỆU CHỈNH QUANG HỌC',
  READY: 'SẴN SÀNG',

  // intro
  'EXPLORATION SYSTEM ONLINE': 'HỆ THỐNG THÁM HIỂM ĐÃ SẴN SÀNG',
  'GALACTIC SECTOR: UNKNOWN': 'KHU VỰC THIÊN HÀ: CHƯA XÁC ĐỊNH',
  'MISSION: INTERSTELLAR EXPLORATION': 'NHIỆM VỤ: THÁM HIỂM LIÊN SAO',
  'Beyond the stars. Beyond imagination.': 'Vượt qua những vì sao. Vượt ngoài trí tưởng tượng.',
  'ENTER THE UNIVERSE': 'BƯỚC VÀO VŨ TRỤ',
  'Sound begins when you enter · Best on a desktop with headphones': 'Âm thanh bắt đầu khi bạn bước vào · Đẹp nhất trên máy tính, có tai nghe',
  'Ship status': 'Trạng thái tàu',
  Language: 'Ngôn ngữ',
  LANGUAGE: 'NGÔN NGỮ',

  // top HUD
  'EXPLORATION MODE': 'CHẾ ĐỘ THÁM HIỂM',
  TRANSIT: 'ĐANG DI CHUYỂN',
  SECTOR: 'KHU VỰC',
  ENGINE: 'ĐỘNG CƠ',
  SIGNAL: 'TÍN HIỆU',
  STRONG: 'MẠNH',
  NOMINAL: 'ỔN ĐỊNH',
  ATTENUATED: 'SUY YẾU',
  FAINT: 'RẤT YẾU',
  'NO CARRIER': 'MẤT SÓNG',
  'DOPPLER SHIFT': 'LỆCH DOPPLER',

  // engine status and travel stages
  STANDBY: 'CHỜ',
  'POWER UP': 'CẤP NGUỒN',
  'ENGINE START': 'KHỞI ĐỘNG',
  IDLE: 'NGHỈ',
  ALIGNING: 'CĂN HƯỚNG',
  CHARGING: 'NẠP NĂNG LƯỢNG',
  'PREPARING SECTOR': 'CHUẨN BỊ KHU VỰC',
  WARP: 'WARP',
  ARRIVING: 'ĐANG TỚI NƠI',
  DECELERATING: 'GIẢM TỐC',
  MANOEUVRING: 'ĐIỀU ĐỘNG',
  CRUISE: 'HÀNH TRÌNH',
  BOARDING: 'LÊN TÀU',

  // cinematic events
  'PLANETARY FLYBY': 'BAY SÁT HÀNH TINH',
  'NEBULA PASSAGE': 'XUYÊN QUA TINH VÂN',
  'GALAXY REVEAL': 'THIÊN HÀ HIỆN RA',
  SKIP: 'BỎ QUA',

  // control bar
  VIEW: 'GÓC NHÌN',
  'WARP DRIVE': 'ĐỘNG CƠ WARP',
  ENGAGE: 'KÍCH HOẠT',
  NAVIGATION: 'ĐIỀU HƯỚNG',
  AUDIO: 'ÂM THANH',
  SETTINGS: 'CÀI ĐẶT',
  'RESET VIEW': 'ĐẶT LẠI',
  'Ship controls': 'Điều khiển tàu',
  'View presets': 'Góc nhìn có sẵn',
  FORWARD: 'PHÍA TRƯỚC',
  'PORT WINDOW': 'CỬA SỔ TRÁI',
  'STARBOARD WINDOW': 'CỬA SỔ PHẢI',
  OVERHEAD: 'PHÍA TRÊN',
  CONSOLE: 'BẢNG ĐIỀU KHIỂN',

  // audio panel
  Audio: 'Âm thanh',
  'SOUND ON': 'BẬT ÂM THANH',
  'SOUND OFF': 'TẮT ÂM THANH',
  MASTER: 'TỔNG',
  MUSIC: 'NHẠC',
  'SHIP & EFFECTS': 'TÀU & HIỆU ỨNG',
  volume: 'âm lượng',
  'Synthesised live in your browser. In-cabin sound design: space itself is silent.':
    'Âm thanh được tổng hợp trực tiếp trong trình duyệt. Đây là âm thanh trong khoang tàu: ngoài không gian hoàn toàn im lặng.',

  // settings
  Settings: 'Cài đặt',
  'RENDER QUALITY': 'CHẤT LƯỢNG HÌNH ẢNH',
  AUTO: 'TỰ ĐỘNG',
  HIGH: 'CAO',
  MEDIUM: 'VỪA',
  LOW: 'THẤP',
  'AUTO adapts resolution to your measured frame rate. Resolution and bloom change immediately':
    'TỰ ĐỘNG điều chỉnh độ phân giải theo tốc độ khung hình đo được. Độ phân giải và hiệu ứng toả sáng đổi ngay',
  '; star counts and texture sizes change after a reload.': '; số lượng sao và kích thước texture đổi sau khi tải lại trang.',
  'RELOAD TO APPLY FULLY': 'TẢI LẠI ĐỂ ÁP DỤNG ĐẦY ĐỦ',
  'REDUCED MOTION': 'GIẢM CHUYỂN ĐỘNG',
  'Replaces warp streaks, shake and flashes with a fade': 'Thay vệt sáng warp, rung và chớp sáng bằng hiệu ứng mờ dần',
  'PERFORMANCE READ-OUT': 'THÔNG SỐ HIỆU NĂNG',
  'Frame rate, resolution scale, draw calls': 'Tốc độ khung hình, tỉ lệ phân giải, số lệnh vẽ',
  'SHOW CONTROLS': 'XEM HƯỚNG DẪN ĐIỀU KHIỂN',
  'Performance read-out': 'Thông số hiệu năng',
  draws: 'lệnh vẽ',
  tris: 'tam giác',

  // help
  Controls: 'Điều khiển',
  CONTROLS: 'ĐIỀU KHIỂN',
  Close: 'Đóng',
  'Dismiss hint': 'Ẩn gợi ý',
  'DRAG to look': 'KÉO để nhìn quanh',
  'SCROLL to zoom': 'CUỘN để phóng to',
  'CLICK a world to scan': 'NHẤP vào thiên thể để quét',
  Drag: 'Kéo chuột',
  'Look around the deck': 'Nhìn quanh khoang quan sát',
  'W A S D / arrows': 'W A S D / phím mũi tên',
  'Look with the keyboard': 'Nhìn quanh bằng bàn phím',
  'Scroll / pinch / + −': 'Cuộn / chụm hai ngón / + −',
  'Zoom the view': 'Phóng to, thu nhỏ',
  'Click a world': 'Nhấp vào thiên thể',
  'Scan it, then Focus or Observe': 'Quét, rồi chọn Hướng tới hoặc Quan sát',
  'Navigation panel': 'Bảng điều hướng',
  'Reset view': 'Đặt lại góc nhìn',
  'Mute / unmute': 'Tắt / bật tiếng',
  'Skip the current sequence': 'Bỏ qua đoạn đang diễn ra',
  'This help': 'Bảng hướng dẫn này',
  'Scale and distances are artistic, not physical. Objects marked FICTIONAL are invented for this voyage. All sound is in-cabin sound design; space itself is silent.':
    'Tỉ lệ và khoảng cách mang tính nghệ thuật, không đúng vật lý. Các thiên thể gắn nhãn HƯ CẤU được sáng tạo riêng cho chuyến đi này. Mọi âm thanh là âm thanh trong khoang tàu; ngoài không gian hoàn toàn im lặng.',
  'CLICK TO SCAN': 'NHẤP ĐỂ QUÉT',

  // navigation panel
  Navigation: 'Điều hướng',
  'Collapse navigation': 'Thu gọn bảng điều hướng',
  HERE: 'TẠI ĐÂY',
  FICTIONAL: 'HƯ CẤU',
  'HOLDING POSITION': 'ĐANG GIỮ VỊ TRÍ',
  'ENGAGE WARP DRIVE': 'KÍCH HOẠT ĐỘNG CƠ WARP',
  'Select a destination to see the flight brief.': 'Chọn một điểm đến để xem tóm tắt hành trình.',

  // target card
  Target: 'Mục tiêu',
  'Close target': 'Đóng mục tiêu',
  'SIMULATED RANGE': 'KHOẢNG CÁCH MÔ PHỎNG',
  FOCUS: 'HƯỚNG TỚI',
  OBSERVE: 'QUAN SÁT',

  // destinations
  UNCHARTED: 'CHƯA ĐƯỢC LẬP BẢN ĐỒ',
  UNKNOWN: 'CHƯA XÁC ĐỊNH',
  'EARTH ORBIT': 'QUỸ ĐẠO TRÁI ĐẤT',
  'MARS ORBIT': 'QUỸ ĐẠO SAO HỎA',
  'JUPITER SYSTEM': 'HỆ SAO MỘC',
  'SATURN SYSTEM': 'HỆ SAO THỔ',
  'NEBULA SECTOR': 'VÙNG TINH VÂN',
  'DEEP SPACE': 'KHÔNG GIAN SÂU',
  'GALAXY VIEW': 'TOÀN CẢNH THIÊN HÀ',
  'UNKNOWN EXOPLANET': 'NGOẠI HÀNH TINH BÍ ẨN',
  'SOL · 1.00 AU': 'HỆ MẶT TRỜI · 1,00 AU',
  'SOL · 1.52 AU': 'HỆ MẶT TRỜI · 1,52 AU',
  'SOL · 5.20 AU': 'HỆ MẶT TRỜI · 5,20 AU',
  'SOL · 9.5 AU': 'HỆ MẶT TRỜI · 9,5 AU',
  'INTERSTELLAR VOID': 'KHOẢNG KHÔNG LIÊN SAO',
  'INTERGALACTIC SPACE': 'KHÔNG GIAN LIÊN THIÊN HÀ',
  'VESPER BINARY': 'SAO ĐÔI VESPER',
  'Home. High orbit above the day–night terminator, with the Moon rising beyond the limb.':
    'Quê nhà. Quỹ đạo cao phía trên ranh giới ngày đêm, Mặt Trăng đang nhô lên sau rìa hành tinh.',
  'The red planet from orbit, with a stream of asteroids drifting in the distance.':
    'Hành tinh đỏ nhìn từ quỹ đạo, xa xa là một dòng tiểu hành tinh trôi lặng lẽ.',
  'A close pass over the cloud tops of the largest planet, with the Galilean moons in attendance.':
    'Bay sát đỉnh mây của hành tinh lớn nhất, bên cạnh là các vệ tinh Galileo.',
  'Above the ring plane, where the planet\'s shadow falls across a hundred thousand kilometres of ice.':
    'Phía trên mặt phẳng vành đai, nơi bóng hành tinh đổ dài trên hàng trăm nghìn kilômét băng.',
  'Into the gas itself: a slow passage through glowing clouds and drifting dust.':
    'Đi thẳng vào lòng khí: chậm rãi xuyên qua những đám mây phát sáng và bụi trôi.',
  'Nothing nearby for light-years. Engines idle; only a distant cluster and the faint band of the galaxy.':
    'Không có gì ở gần trong nhiều năm ánh sáng. Động cơ nghỉ; chỉ còn một cụm sao xa và dải thiên hà mờ nhạt.',
  'Far outside the disc, where an entire spiral galaxy fits inside the forward window.':
    'Ở rất xa bên ngoài đĩa thiên hà, nơi cả một thiên hà xoắn ốc nằm gọn trong cửa sổ phía trước.',
  'An uncharted world of violet seas beneath two suns. Fictional destination.':
    'Một thế giới chưa có trên bản đồ với biển tím dưới hai mặt trời. Điểm đến hư cấu.',

  // ship AI, fixed lines
  'Select a destination to engage the warp drive.': 'Hãy chọn điểm đến để kích hoạt động cơ warp.',
  'Welcome aboard ODYSSEY-01. All systems nominal.': 'Chào mừng lên tàu ODYSSEY-01. Mọi hệ thống hoạt động ổn định.',
  'Warp drive engaged.': 'Đã kích hoạt động cơ warp.',
  'Jump aborted: destination data could not be generated.': 'Đã huỷ bước nhảy: không tạo được dữ liệu điểm đến.',
  'Entering the Azure Veil. Particle density rising; shields nominal.': 'Đang tiến vào Azure Veil. Mật độ hạt tăng dần; lá chắn ổn định.',
  'Dimming deck lights. Helix Crown ahead.': 'Giảm đèn khoang. Helix Crown ở phía trước.',

  // errors
  RELOAD: 'TẢI LẠI',
  'This experience needs WebGL 2, which this browser or device does not provide. Try a current desktop version of Chrome, Edge, Firefox or Safari with hardware acceleration enabled.':
    'Trải nghiệm này cần WebGL 2, nhưng trình duyệt hoặc thiết bị này không hỗ trợ. Hãy thử bản mới của Chrome, Edge, Firefox hoặc Safari trên máy tính và bật tăng tốc phần cứng.',
  'The graphics context was lost. Reload the page to continue.': 'Đã mất ngữ cảnh đồ hoạ. Hãy tải lại trang để tiếp tục.',
  'Interactive 3D view from the observation deck of the starship Odyssey-01': 'Khung nhìn 3D tương tác từ khoang quan sát của tàu vũ trụ Odyssey-01',

  // cockpit screens
  DEST: 'ĐÍCH',
  HDG: 'HƯỚNG',
  ELEV: 'GÓC',
  DRIVE: 'ĐỘNG CƠ',
  'SHIP SYSTEMS': 'HỆ THỐNG TÀU',
  REACTOR: 'LÒ PHẢN ỨNG',
  'LIFE SUPPORT': 'DUY TRÌ SỰ SỐNG',
  'HULL INTEGRITY': 'ĐỘ BỀN VỎ TÀU',
  COOLANT: 'CHẤT LÀM MÁT',
  SHIELDING: 'LÁ CHẮN',
  'SPECTRAL ANALYSIS': 'PHÂN TÍCH QUANG PHỔ',
  'PASSIVE SCAN': 'QUÉT THỤ ĐỘNG',
  'STELLAR CARTOGRAPHY': 'BẢN ĐỒ SAO',
};

// Lines with a variable part. `n` is the already-translated name.
export const VI_PATTERNS = [
  [/^Course plotted: (.+)\. Aligning\.$/, (n) => `Đã vạch lộ trình: ${n}. Đang căn hướng.`],
  [/^Arrived: (.+)\.$/, (n) => `Đã tới: ${n}.`],
  [/^Already holding position at (.+)\.$/, (n) => `Tàu đang giữ vị trí tại ${n}.`],
  [/^Moving to observation position: (.+)\.$/, (n) => `Đang di chuyển tới vị trí quan sát: ${n}.`],
  [/^Beginning close pass of (.+)\.$/, (n) => `Bắt đầu bay sát ${n}.`],
  [/^The experience could not start: (.+)$/, (n) => `Không thể khởi động trải nghiệm: ${n}`],
];

// Bare body names used inside the lines above.
export const VI_NAMES = { EARTH: 'TRÁI ĐẤT', MARS: 'SAO HỎA', JUPITER: 'SAO MỘC', SATURN: 'SAO THỔ', 'UNKNOWN EXOPLANET': 'NGOẠI HÀNH TINH BÍ ẨN' };

const IMG = ['Phân loại', 'Thiên thể tưởng tượng'];

// Target-card data by point-of-interest id. Figures are the same as the English source (NASA fact sheets for real bodies).
export const VI_CELESTIAL = {
  sun: {
    name: 'MẶT TRỜI', type: 'Sao dãy chính loại G2V',
    description: 'Ngôi sao ở trung tâm Hệ Mặt Trời. Nó chiếm 99,86% khối lượng của cả hệ và tổng hợp hydro thành heli trong lõi.',
    facts: [['Bán kính trung bình', '695.700 km'], ['Nhiệt độ bề mặt', '≈ 5.772 K'], ['Tuổi', '≈ 4,6 tỷ năm']],
    more: 'Ánh sáng rời bề mặt Mặt Trời mất khoảng 8 phút 20 giây để tới Trái Đất. Độ chói ở đây đã được lớp kính thích ứng của khoang tàu làm dịu.',
  },
  earth: {
    name: 'TRÁI ĐẤT', type: 'Hành tinh đất đá',
    description: 'Một thế giới đại dương: khoảng 71% bề mặt là nước. Đường xanh mỏng ở chân trời là toàn bộ bầu khí quyển có thể thở được.',
    facts: [['Bán kính trung bình', '6.371 km'], ['Khoảng cách tới Mặt Trời', '1 AU (149,6 triệu km)'], ['Chu kỳ tự quay', '23 giờ 56 phút'], ['Vệ tinh', '1']],
    more: 'Ở phía ban đêm, những mạng lưới vàng nhạt là ánh đèn thành phố. Trái Đất tự quay đủ nhanh để cuộn các hệ mây thành hình xoắn.',
  },
  moon: {
    name: 'MẶT TRĂNG', type: 'Vệ tinh tự nhiên của Trái Đất',
    description: 'Vệ tinh tự nhiên duy nhất của Trái Đất. Các đồng bằng bazan sẫm màu (biển Mặt Trăng) và vùng cao nguyên sáng đầy hố ghi lại bốn tỷ năm va chạm.',
    facts: [['Bán kính trung bình', '1.737 km'], ['Khoảng cách tới Trái Đất', '≈ 384.400 km'], ['Chu kỳ quỹ đạo', '27,3 ngày']],
    more: 'Mặt Trăng bị khoá thuỷ triều: luôn quay cùng một mặt về phía Trái Đất. Ở đây quỹ đạo của nó được vẽ gần hơn nhiều so với thực tế.',
  },
  mars: {
    name: 'SAO HỎA', type: 'Hành tinh đất đá',
    description: 'Một thế giới sa mạc lạnh giá nhuốm màu bụi oxit sắt. Khí quyển carbon dioxide của nó ở bề mặt loãng chưa bằng 1% khí quyển Trái Đất.',
    facts: [['Bán kính trung bình', '3.390 km'], ['Khoảng cách tới Mặt Trời', '1,52 AU'], ['Chu kỳ tự quay', '24 giờ 37 phút'], ['Vệ tinh', '2 (Phobos, Deimos)']],
    more: 'Olympus Mons cao khoảng 22 km, là núi lửa cao nhất từng biết trong Hệ Mặt Trời; Valles Marineris trải dài khoảng 4.000 km dọc xích đạo. Địa hình ở đây được sinh ngẫu nhiên, không theo bản đồ thật.',
  },
  belt: {
    name: 'VÀNH ĐAI TIỂU HÀNH TINH', type: 'Vành đai mảnh vụn quanh sao',
    description: 'Tàn dư đá và kim loại từ thời hình thành hành tinh, quay quanh Mặt Trời giữa Sao Hỏa và Sao Mộc. Thành viên lớn nhất, Ceres, có đường kính khoảng 940 km.',
    facts: [['Vị trí', '≈ 2,1 – 3,3 AU'], ['Thiên thể lớn nhất', 'Ceres (hành tinh lùn)']],
    more: 'Phóng tác nghệ thuật: vành đai thật gần như hoàn toàn trống rỗng, các tiểu hành tinh thường cách nhau hàng trăm nghìn kilômét. Ở đây nó được vẽ dày đặc hơn nhiều.',
  },
  jupiter: {
    name: 'SAO MỘC', type: 'Hành tinh khí khổng lồ',
    description: 'Hành tinh lớn nhất: nặng hơn gấp đôi tất cả các hành tinh khác cộng lại. Các dải sọc là những luồng gió xiết mang mây amoniac.',
    facts: [['Bán kính trung bình', '69.911 km'], ['Khoảng cách tới Mặt Trời', '5,2 AU'], ['Chu kỳ tự quay', '≈ 9 giờ 56 phút'], ['Vệ tinh đã biết', '95 (tính đến 2023)']],
    more: 'Vết Đỏ Lớn là một cơn bão xoáy nghịch rộng hơn cả Trái Đất, được quan sát liên tục từ thế kỷ 19.',
  },
  io: {
    name: 'IO', type: 'Vệ tinh Galileo của Sao Mộc',
    description: 'Thiên thể có núi lửa hoạt động mạnh nhất từng biết. Lực thuỷ triều của Sao Mộc nuôi hàng trăm núi lửa liên tục phủ lại lớp bề mặt lưu huỳnh.',
    facts: [['Bán kính trung bình', '1.822 km'], ['Chu kỳ quỹ đạo', '1,77 ngày']],
  },
  europa: {
    name: 'EUROPA', type: 'Vệ tinh Galileo của Sao Mộc',
    description: 'Một lớp vỏ băng nước bị rạch bởi những vết nứt dài màu đỏ nhạt. Nhiều bằng chứng mạnh cho thấy có một đại dương nước mặn toàn cầu bên dưới.',
    facts: [['Bán kính trung bình', '1.561 km'], ['Chu kỳ quỹ đạo', '3,55 ngày']],
  },
  ganymede: {
    name: 'GANYMEDE', type: 'Vệ tinh Galileo của Sao Mộc',
    description: 'Vệ tinh lớn nhất Hệ Mặt Trời, lớn hơn cả Sao Thủy, và là vệ tinh duy nhất được biết có từ trường riêng.',
    facts: [['Bán kính trung bình', '2.634 km'], ['Chu kỳ quỹ đạo', '7,15 ngày']],
  },
  callisto: {
    name: 'CALLISTO', type: 'Vệ tinh Galileo của Sao Mộc',
    description: 'Một bề mặt cổ xưa, sẫm màu, dày đặc hố va chạm, thuộc hàng nhiều hố nhất trong Hệ Mặt Trời.',
    facts: [['Bán kính trung bình', '2.410 km'], ['Chu kỳ quỹ đạo', '16,7 ngày']],
  },
  saturn: {
    name: 'SAO THỔ', type: 'Hành tinh khí khổng lồ',
    description: 'Một hành tinh khổng lồ hydro và heli có khối lượng riêng nhỏ hơn nước, bao quanh bởi các vành băng nước từ cỡ hạt bụi đến khối to bằng ngôi nhà.',
    facts: [['Bán kính trung bình', '58.232 km'], ['Khoảng cách tới Mặt Trời', '9,5 AU'], ['Chu kỳ tự quay', '≈ 10 giờ 33 phút'], ['Bề rộng vành chính', '≈ 270.000 km']],
    more: 'Các vành chính rất rộng nhưng thường chỉ dày khoảng 10 mét. Khe tối là Khe Cassini. Một luồng gió xiết hình lục giác tồn tại lâu dài quanh cực bắc.',
  },
  titan: {
    name: 'TITAN', type: 'Vệ tinh của Sao Thổ',
    description: 'Vệ tinh duy nhất có khí quyển dày: lớp sương mù nitơ đặc hơn không khí Trái Đất, bên trên những hồ và biển metan, etan lỏng.',
    facts: [['Bán kính trung bình', '2.575 km'], ['Chu kỳ quỹ đạo', '15,9 ngày']],
  },
  azure: {
    name: 'AZURE VEIL', type: 'Tinh vân phát xạ và phản xạ',
    description: 'Một vườn ươm sao tưởng tượng. Ánh xanh lam là ánh sao bị bụi tán xạ; các nút sáng là khí bị những ngôi sao mới sinh bên trong ion hoá.',
    facts: [IMG, ['Bề rộng mô phỏng', '≈ 28 năm ánh sáng']],
    more: 'Tương tự ngoài đời thật: các tinh vân phản xạ như vùng mây quanh cụm Pleiades có màu xanh vì bụi mịn tán xạ bước sóng ngắn hiệu quả nhất.',
  },
  violet: {
    name: 'VIOLET SHROUD', type: 'Tinh vân phát xạ',
    description: 'Một đám mây tưởng tượng đồng hành với Azure Veil, nơi ánh đỏ của hydro và ánh xanh tán xạ hoà thành màu tím.',
    facts: [IMG, ['Bề rộng mô phỏng', '≈ 20 năm ánh sáng']],
  },
  crimson: {
    name: 'CRIMSON EXPANSE', type: 'Tinh vân phát xạ H II',
    description: 'Một đám mây hydro ion hoá tưởng tượng. Ở các vùng H II thật, màu đỏ thẫm này đến từ vạch hydro-alpha ở 656 nm.',
    facts: [IMG, ['Bề rộng mô phỏng', '≈ 80 năm ánh sáng']],
  },
  aurum: {
    name: 'AURUM CLOUD', type: 'Tinh vân phản xạ nhiều bụi',
    description: 'Một tinh vân vàng tưởng tượng: bụi dày được chiếu sáng từ bên trong bởi những ngôi sao già và nguội, với các dải tối nổi trên nền sáng.',
    facts: [IMG, ['Bề rộng mô phỏng', '≈ 50 năm ánh sáng']],
  },
  cluster: {
    name: 'CỤM SAO CẦU GC-7', type: 'Cụm sao cầu',
    description: 'Một cụm sao tưởng tượng. Các cụm sao cầu thật nén hàng trăm nghìn ngôi sao rất già vào một quả cầu rộng khoảng một trăm năm ánh sáng.',
    facts: [IMG, ['Tuổi điển hình (cụm thật)', '10 – 13 tỷ năm']],
  },
  galaxy: {
    name: 'HELIX CROWN', type: 'Thiên hà xoắn ốc có thanh',
    description: 'Một thiên hà xoắn ốc tưởng tượng với các nhánh rõ nét. Giống Ngân Hà, những thiên hà xoắn ốc thật loại này rộng khoảng 100.000 năm ánh sáng và chứa hàng trăm tỷ ngôi sao.',
    facts: [IMG, ['Đường kính mô phỏng', '≈ 110.000 năm ánh sáng'], ['Cấu trúc', 'Thanh ngang, 2 nhánh chính, dải bụi']],
    more: 'Các nhánh xanh lam là sao trẻ và nóng; phần phình màu vàng là sao già; các nút hồng là mây hydro đang sinh sao; dải tối là bụi in bóng. Mỗi điểm được vẽ đại diện cho hàng triệu ngôi sao.',
  },
  elliptical: {
    name: 'THIÊN HÀ ELIP E3-A', type: 'Thiên hà elip',
    description: 'Một thiên hà elip tưởng tượng: một bầy sao già màu vàng phân bố mịn, hầu như không còn khí để sinh sao mới.',
    facts: [IMG],
  },
  irregular: {
    name: 'THIÊN HÀ VÔ ĐỊNH HÌNH IR-9', type: 'Thiên hà vô định hình',
    description: 'Một thiên hà lùn vô định hình tưởng tượng, không có phần phình hay nhánh xoắn, sống động với các cụm sao xanh và vùng sinh sao màu hồng.',
    facts: [IMG],
  },
  exo: {
    name: 'VESPERA', type: 'Ngoại hành tinh đại dương',
    description: 'Một thế giới tưởng tượng với biển tím và lục địa đá vỏ chai. Các mạch khoáng và vùng nước nông phát sáng khi đêm xuống, còn núi của nó cao vượt mọi ngọn núi trên Trái Đất.',
    facts: [['Phân loại', 'Thế giới tưởng tượng'], ['Bán kính mô phỏng', '8.200 km'], ['Sao chủ', 'Sao đôi (trắng xanh + cam)'], ['Vệ tinh', '2']],
    more: 'Mọi thứ về Vespera đều được sáng tạo cho chuyến đi này: chưa từng quan sát thấy hành tinh nào như vậy.',
  },
  exoMoonA: {
    name: 'VESPERA I · "GLASS"', type: 'Vệ tinh băng',
    description: 'Một vệ tinh băng tưởng tượng chằng chịt các vết nứt màu ngọc lam.',
    facts: [IMG],
  },
  exoMoonB: {
    name: 'VESPERA II · "EMBER"', type: 'Vệ tinh đá',
    description: 'Một vệ tinh tưởng tượng nhỏ, màu gỉ sắt, dày đặc hố va chạm.',
    facts: [IMG],
  },
  exoStarA: {
    name: 'VESPER A', type: 'Sao chính màu trắng xanh',
    description: 'Ngôi sao chính tưởng tượng của một hệ sao đôi gần. Sao đôi ngoài đời thật rất phổ biến: khoảng một nửa số sao giống Mặt Trời có bạn đồng hành.',
    facts: [IMG],
  },
  exoStarB: {
    name: 'VESPER B', type: 'Sao đồng hành màu cam',
    description: 'Ngôi sao đồng hành tưởng tượng, nguội hơn, quay quanh người bạn sáng hơn của nó.',
    facts: [IMG],
  },
};
