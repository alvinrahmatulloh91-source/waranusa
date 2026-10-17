// Data seed WaraNusa — Bagian A: Sumatra & Jawa
// Struktur tiap provinsi: identitas + 5 kategori item budaya.

export interface SoundSpec {
  id: string
  label: string
  freq: number
  type: 'gamelan' | 'gong' | 'drum' | 'bamboo' | 'pluck' | 'wood' | 'frame'
  note: string
  param?: string // utk drum: low | mid | high | slap
}

export interface PartSpec {
  id: string
  name: string
  pos: [number, number, number]
  color: string
  function: string
  philosophy: string
}

export interface ItemSeed {
  category: 'RUMAH_ADAT' | 'PAKAIAN_ADAT' | 'ALAT_MUSIK' | 'TARIAN' | 'MAKANAN'
  name: string
  region?: string
  shortDesc: string
  description: string
  philosophy: string
  model3d?: string
  parts?: PartSpec[]
  playable?: boolean
  sounds?: SoundSpec[]
  melody?: string[]
  sources: { title: string; url?: string }[]
}

export interface ProvinceSeed {
  name: string
  slug: string
  island: string
  capital: string
  lat: number
  lng: number
  motto: string
  description: string
  history: string
  traditions: string
  items: ItemSeed[]
}

const WIKI = (t: string) => ({ title: `Wikipedia Indonesia — ${t}`, url: `https://id.wikipedia.org/wiki/${encodeURIComponent(t)}` })
const WBT = { title: 'Direktori Warisan Budaya Takbenda Kemendikbudristek', url: 'https://warisanbudaya.kemdikbud.go.id/' }

export const SUMATRA_JAWA: ProvinceSeed[] = [
  {
    name: 'Aceh', slug: 'aceh', island: 'sumatra', capital: 'Banda Aceh',
    lat: 5.55, lng: 95.32, motto: 'Serambi Mekkah',
    description: 'Provinsi paling barat di ujung Pulau Sumatra, dijuluki "Serambi Mekkah" karena menjadi pintu masuk Islam ke Nusantara. Aceh kaya akan tradisi Islam-Nusantara, kesenian berirama rapai, serta kuliner berbahan dasar rempah.',
    history: 'Kesultanan Aceh Darussalam berdiri sejak abad ke-15 dan mencapai puncak kejayaan pada masa Sultan Iskandar Muda (1607–1636) sebagai pusat perdagangan lada dan kain. Aceh dikenal sebagai benteng perlawanan terakhir terhadap kolonial Belanda dalam Perang Aceh, dengan pahlawan seperti Cut Nyak Dhien dan Teuku Umar. Nilai keislaman yang kuat menjelma dalam seluruh aspek seni, arsitektur, dan adat istiadatnya.',
    traditions: 'Tradisi meunasah dan musyawarah gampong menghidupkan gotong royong; pepatihe (hukum adat) bersanding seiring syariat dalam lembaga Adat bak Po Teumeureuhom. Seni rapai dan seudati mengiringi perayaan Maulid dan menjadi panggung pengembangan ilmu agama serta ketahanan fisik masyarakat.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Rumoh Aceh', region: 'Aceh',
        shortDesc: 'Rumah panggung kayu tahan gempa tanpa paku, tersusun tiga bagian dengan filosofi perjalanan hidup manusia.',
        description: 'Rumoh Aceh adalah rumah panggung berukuran besar yang dibangun dari kayu keras dan diikat penuh dengan pasak tanpa satu pun paku. Tiga serangkai atap rumbia melindungi interior dari hujan dan panas tropis, sementara lantai yang diangkat menjauhkan rumah dari binatang dan lembap.',
        philosophy: 'Ruangnya terbagi menjadi seuramoee (tempat menerima tamu), teungku nie (kamar), dan that (ruang belakang) — menggambarkan tahapan hidup manusia dari publik menuju kebatinan. Bentuk panggungnya melambangkan kehati-hatian menjalani hidup agar tidak tergelincir.',
        model3d: 'panggung:rumoh',
        parts: [
          { id: 'p1', name: 'Tiang Penting', pos: [0, 0.6, 0], color: '#8a5a2b', function: 'Empat tiang utama penopang seluruh konstruksi rumah.', philosophy: 'Melambangkan empat unsur kehidupan: api, angin, air, dan tanah — keseimbangan alam sebagai fondasi rumah tangga.' },
          { id: 'p2', name: 'Seuramoee', pos: [0, 1.7, 1.3], color: '#b98a56', function: 'Serambi depan untuk menerima tamu dan upacara adat.', philosophy: 'Simbol keterbukaan masyarakat Aceh yang memuliakan tamu sebelum urusan pribadi.' },
          { id: 'p3', name: 'Ranting (Atap)', pos: [0, 2.8, 0], color: '#6b4f2e', function: 'Atap tiga lapis dari daun rumbia yang menjaga suhu interior tetap sejuk.', philosophy: 'Lapisan bertingkat mengajarkan kesabaran bertahap dalam meraih tujuan hidup.' },
          { id: 'p4', name: 'That', pos: [0, 1.7, -1.2], color: '#a1743f', function: 'Ruang belakang untuk kamar tidur dan penyimpanan harta.', philosophy: 'Bagian paling tertutup dan sakral, melambangkan kehormatan keluarga yang dijaga dari pandangan luar.' },
        ],
        sources: [WIKI('Rumoh Aceh'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Ulee Balang', region: 'Aceh',
        shortDesc: 'Busana kebesaran bersulam emas: baju Meukasang, celana Sirikalee, dan keris Reundang.',
        description: 'Ulee Balang adalah pakaian kebesaran Aceh yang terdiri atas baju panjang bersulam benang emas bernama Meukasang, celana Sirikalee, dan aksesori seperti keris Reundang, tunong (tengkuluk), serta kulu (rantai emas).',
        philosophy: 'Warna dan sulaman emasnya menggambarkan keagungan dan kemakmuran Kesultanan Aceh; setiap perhiasan membawa doa keselamatan bagi pemakainya.',
        sources: [WIKI('Ulee Balang'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Rapai Geleng', region: 'Aceh',
        shortDesc: 'Ansambel rebana bulat yang dimainkan sambil bergoyang serempak, syair berisi nasihat agama.',
        description: 'Rapai Geleng merupakan ansambel enam hingga sepuluh rebana bulat kecil yang dimainkan duduk bersila sambil menggeleng kanan-kiri secara serempak. Setiap rapai menghasilkan nada berbeda sehingga membentuk melodi ritmis yang hidup.',
        philosophy: 'Gerakan menggeleng melambangkan keserempakan hati umat; syairnya menyampaikan nasihat keagamaan, nasihat adat, dan kisah para nabi.',
        model3d: 'rapai',
        playable: true,
        sounds: [
          { id: 'r1', label: 'Rapai 1', freq: 220, type: 'frame', note: 'Dum', param: 'low' },
          { id: 'r2', label: 'Rapai 2', freq: 294, type: 'frame', note: 'Dum', param: 'mid' },
          { id: 'r3', label: 'Rapai 3', freq: 392, type: 'frame', note: 'Tak', param: 'high' },
        ],
        melody: ['r1', 'r3', 'r2', 'r3', 'r1', 'r1', 'r3', 'r2', 'r3', 'r1'],
        parts: [
          { id: 'p1', name: 'Kulit Rapai', pos: [-0.7, 1.0, 0], color: '#d9c49a', function: 'Membran kulit kambing yang dipukul untuk menghasilkan bunyi.', philosophy: 'Kulit yang dikencangkan melambangkan kedisiplinan pelajar rapai dalam menjaga irama bersama.' },
          { id: 'p2', name: 'Rangka Kayu', pos: [0, 0.95, 0], color: '#8a5a2b', function: 'Bingkai kayu ringan berbentuk lingkaran.', philosophy: 'Bulatan rapai menegaskan tidak adanya awal dan akhir dalam ketaatan beragama.' },
          { id: 'p3', name: 'Simpai Dudukan', pos: [0, 0.55, 0.6], color: '#6b4f2e', function: 'Simpai penyangga setiap rapai pada dudukan.', philosophy: 'Setiap pemain duduk sejajar — simbol persaudaraan tanpa pembeda derajat.' },
        ],
        sources: [WIKI('Rapai'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Saman', region: 'Gayo',
        shortDesc: 'Tari tangan berbaris satu larik yang mendunia, kecepatan gerak tanpa iringan musik.',
        description: 'Tari Saman dari suku Gayo dimainkan para penari yang duduk berbanjar menyatu bahu dengan gerak tepuk dada, tepuk tangan, dan dada menepuk lantai yang makin lama makin cepat. UNESCO menetapkannya sebagai Warisan Budaya Takbenda pada 2011.',
        philosophy: 'Gerakan serempaknya menegaskan persatuan Gayo: "luah tawar" (membuka dan menutup) mengajarkan kekompakan, ketertiban, dan ketaatan pada pemimpin (syeikh).',
        sources: [WIKI('Tari Saman'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Kuah Pliek U', region: 'Aceh',
        shortDesc: 'Sayur khas dari sisa kelapa sangrai yang diaduk berjam-jam hingga mengeluarkan minyak pliek.',
        description: 'Kuah Pliek U adalah masakan sayur khas Aceh dari campuran buah dan sayur — melinjo, kacang, labu, daun melinjo — dengan bumbu utama pliek u, minyak dari kelapa sangrai lama yang diaduk berjam-jam.',
        philosophy: 'Berakar dari masa krisis pangan era perang, hidangan ini mengajarkan ikhtiar memanfaatkan alam dan menjadi simbol kesetaraan karena seluruh lapisan masyarakat memakannya bersama.',
        sources: [WIKI('Kuah Pliek U'), WBT],
      },
    ],
  },
  {
    name: 'Sumatera Utara', slug: 'sumatera-utara', island: 'sumatra', capital: 'Medan',
    lat: 3.6, lng: 98.67, motto: 'Bhineka Tunggal Ika',
    description: 'Provinsi di pesisir timur Sumatra yang menjadi rumah Batak, Nias, Melayu, dan Tionghoa. Tor-tor dan ulos menjadi identitas yang diakui dunia.',
    history: 'Kerajaan Batak tumbuh di dataran tinggi Toba dengan pusat kekuasaan di Bakkara pada abad ke-16 hingga awal 1800-an. Misi Ludwig Ingwer Nommensen pada 1861 membawa perubahan besar melalui pendidikan dan agama Kristen Protestan. Pada 2009 UNESCO menetapkan Tor-tor dan ulos sebagai warisan budaya yang membutuhkan perlindungan segera.',
    traditions: 'Adat marsiadap hari (membangun rumah) menghidupkan gotong royong Horja; upacara mangulosi (mengikat) menjadi momen berkah bagi keluarga yang menikah, pindah rumah, atau merayakan kelahiran. Ulos diwariskan dari ibu ke anak sebagai doa yang ditenun.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Rumah Bolon', region: 'Batak Toba',
        shortDesc: 'Rumah panggung Batak Toba bertiang besar, atap runcing, dinding penuh ukiran gorga.',
        description: 'Rumah Bolon (rumah besar) dibangun di atas tiang kayu hingga 1,75 meter dengan tangga lurus di tengah. Dindingnya terbuat dari papan yang diukir gorga tiga warna — merah, hitam, putih — dan atapnya menjulang runcing menyerupai perahu terbalik.',
        philosophy: 'Rumah Bolon dihuni empat keluarga dari satu marga — simbol kebersamaan marga. Atap menunjukkan "Mulajadi Na Bolon" (Sang Pencipta), badan rumah dunia manusia, dan kolong tempat ternak dunia bawah.',
        model3d: 'bolon',
        parts: [
          { id: 'p1', name: 'Tiang Bolon', pos: [-2.2, 0.8, 1.2], color: '#8a5a2b', function: 'Tiang utama besar penopang badan rumah.', philosophy: 'Simbol kepala marga sebagai penopang seluruh anggota keluarga.' },
          { id: 'p2', name: 'Siparepare (Teres)', pos: [0, 1.8, 1.5], color: '#b98a56', function: 'Teras depan tempat duduk tamu dan musyawarah marga.', philosophy: 'Tempat "marsiadap hari" — orang tua menerima ucapan selamat dari anak yang baru menikah.' },
          { id: 'p3', name: 'Tamiang (Papan Gable)', pos: [0, 3.3, 1.1], color: '#a1743f', function: 'Papan penutup sisi atap dengan ukiran gorga.', philosophy: 'Ukirannya doa keselamatan; motif boraspati (cicak) menjadi penolak bala.' },
          { id: 'p4', name: 'Gorga (Ukiran Dinding)', pos: [0, 2.4, 1.75], color: '#c0392b', function: 'Ukiran tiga warna di dinding luar rumah.', philosophy: 'Merah untuk keberanian, hitam untuk tanah, putih untuk kesucian — harmoni hidup bermasyarakat.' },
        ],
        sources: [WIKI('Rumah Bolon'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Ulos', region: 'Batak Toba',
        shortDesc: 'Kain tenun yang diberikan dalam upacara adat sebagai doa dan restu orang tua.',
        description: 'Ulos adalah kain tenun buatan tangan suku Batak dengan motif geometris yang diselipkan benang berwarna hitam, merah, dan putih. Jenisnya — ulos ragidup, sibolang, sadum — diberikan pada momen berbeda: kelahiran, perkawinan, dan kematian.',
        philosophy: 'Ulos "dipanaitu" (diikatkan) sebagai pengikat restu orang tua kepada anak; warnanya membawa pesan dosa-budi, keberanian, dan kesucian.',
        sources: [WIKI('Ulos'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Taganing', region: 'Batak Toba',
        shortDesc: 'Set lima gendang bernada dari tinggi ke rendah, otak ritme gondang sabangunan.',
        description: 'Taganing adalah rangkaian lima gendang yang tersusun dari nada tinggi ke rendah, dimainkan satu pemain dengan dua stik. Taganing memimpin seluruh ansambel gondang sabangunan bersama sarune bolon dan gong.',
        philosophy: 'Lima gendangnya melambangkan lima jari tangan yang bekerja sebagai satu — alat yang memimpin harus mampu mengatur harmoni semua alat lain.',
        model3d: 'taganing',
        playable: true,
        sounds: [
          { id: 't1', label: 'Taganing 1', freq: 392, type: 'drum', note: 'Tak', param: 'high' },
          { id: 't2', label: 'Taganing 2', freq: 330, type: 'drum', note: 'Tak', param: 'high' },
          { id: 't3', label: 'Taganing 3', freq: 262, type: 'drum', note: 'Dum', param: 'mid' },
          { id: 't4', label: 'Taganing 4', freq: 220, type: 'drum', note: 'Dum', param: 'mid' },
          { id: 't5', label: 'Taganing 5', freq: 165, type: 'drum', note: 'Dum', param: 'low' },
        ],
        melody: ['t1', 't2', 't3', 't4', 't5', 't5', 't4', 't3', 't2', 't1', 't3', 't3', 't5', 't5', 't1'],
        parts: [
          { id: 'p1', name: 'Gendang Taganing', pos: [0, 1.0, 0], color: '#b98a56', function: 'Lima gendang bertingkat nada yang dipukul dengan stik kayu.', philosophy: 'Setiap gendang diberi nama; masing-masing punya peran yang tak tergantikan dalam ansambel.' },
          { id: 'p2', name: 'Rangka Taganing', pos: [0, 0.45, 0.4], color: '#8a5a2b', function: 'Dudukan kayu yang menyatukan kelima gendang.', philosophy: 'Rangka yang menyatukan melambangkan ikatan marga yang mempersatukan anggotanya.' },
          { id: 'p3', name: 'Tabuh', pos: [1.3, 0.8, 0.5], color: '#6b4f2e', function: 'Stik kayu untuk memukul membran.', philosophy: 'Pukulan adalah sinyal — taganing memberi aba-aba kepada semua alat lain.' },
        ],
        sources: [WIKI('Taganing'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Tor-tor', region: 'Batak Toba',
        shortDesc: 'Tari ritual diiringi gondang sabangunan, penari mengayunkan ulos di tangan.',
        description: 'Tor-tor adalah tarian ritual Batak Toba yang diiringi gondang sabangunan; para penari mengayunkan selendang ulos dengan gerakan tangan dan langkah kaki yang lambat namun penuh makna. Tor-tor Pangurason (pembersihan), Tor-tor Sipitu Cawan (tujuh piring), dan Tor-tor Panaluan memiliki fungsi adat yang berbeda.',
        philosophy: 'Tor-tor menjadi sarana berkomunikasi dengan Mulajadi Na Bolon (Sang Pencipta) dan roh leluhur — ulos yang dikibarkan adalah doa yang ditenun menjadi gerak.',
        sources: [WIKI('Tor-tor'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Ikan Arsik', region: 'Batak Toba',
        shortDesc: 'Ikan mas Danau Toba dimasak bumbu andaliman tanpa santan, sajian wajib Horja.',
        description: 'Ikan Arsik adalah ikan mas dari Danau Toba yang dimasak dengan bumbu andaliman, asam kandis, kunyit, dan daun rimbang tanpa santan. Hidangan ini wajib hadir dalam Horja dan upacara adat Batak.',
        philosophy: 'Ikan mas yang utuh melambangkan kesuburan dan berkah; sajian tanpa potongan menegaskan kesatuan keluarga yang tidak boleh terpisah.',
        sources: [WIKI('Arsik'), WBT],
      },
    ],
  },
  {
    name: 'Sumatera Barat', slug: 'sumatera-barat', island: 'sumatra', capital: 'Padang',
    lat: -0.95, lng: 100.35, motto: 'Tuah Sakato',
    description: 'Tanah Minangkabau di sepanjang Barisan dan pesisir barat Sumatra. Rumah Gadang bertanduk, matriarki, dan randai menjadikannya ikon budaya Indonesia.',
    history: 'Kerajaan Pagaruyung menjadi pusat budaya Minangkabau hingga runtuhnya pada 1825 dalam Perang Padri. Perdagangan kopi dan kain emas membuat Minangkabau berperan besar sebagai penggerak ekonomi pulau. Konsep adat "alam takambang jadi guru" menjadikan Minangkabau melahirkan banyak ulama, sastrawan, dan pendiri negara.',
    traditions: 'Sistem kekerabatan matrilineal mewariskan harta melalui ibu, sementara syarak dan agama dijalankan para pria melalui penghulu dan alim ulama. Musyawarah marga di balai membentuk keputusan bersama, dan tradisi merantau melembagakan mobilitas anak rantau.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Rumah Gadang', region: 'Minangkabau',
        shortDesc: 'Rumah adat Minangkabau dengan atap melengkung berujung tanduk gonjong yang ikonik.',
        description: 'Rumah Gadang adalah rumah panggung panjang milik suku (keluarga matrilineal) yang dibangun menghadap ke jalan dengan atap 9 hingga 13 gonjong (tanduk melengkung). Dindingnya tersusun dari papan yang dibaut tanpa paku dengan teknik pasak dan ukiran Minang berwarna merah, kuning, dan hitam.',
        philosophy: 'Gonjongnya menyerupai tanduk kerbau — mengenang legenda kemenangan Minangkabau atas tuanku Siam dalam pertarungan kerbau. Ruangnya dibagi sesuai fungsi: balai (musyawarah), bilik (kamar), dapur; rumah ibu adalah pusat harta pusaka.',
        model3d: 'gadang',
        parts: [
          { id: 'p1', name: 'Gonjong', pos: [2.9, 4.4, 0], color: '#6b4f2e', function: 'Ujung tanduk melengkung di kedua sisi atap.', philosophy: 'Meniru tanduk kerbau — simbol kejayaan dan kemenangan rakyat Minangkabau.' },
          { id: 'p2', name: 'Anjungan', pos: [3.2, 2.4, 0], color: '#b98a56', function: 'Serambi depan dengan tangga untuk masuk ke rumah.', philosophy: 'Tangga bertingkat mengajarkan ketinggian budi yang dicapai bertahap.' },
          { id: 'p3', name: 'Lantai Panggung', pos: [0, 1.7, 0], color: '#8a5a2b', function: 'Lantai diangkat dari tanah melalui sistem pasak.', philosophy: 'Rumah melayang di atas tanah melambangkan kesadaran menjaga diri dari gejolak dunia.' },
          { id: 'p4', name: 'Dinding Baruyung', pos: [0, 2.8, 1.75], color: '#a1743f', function: 'Dinding papan berlapis dengan ukiran khas Minang.', philosophy: 'Ukiran berisi "tataban salokan" — nasihat hidup yang tertulis dalam bentuk ornamen.' },
        ],
        sources: [WIKI('Rumah Gadang'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Bundo Kanduang', region: 'Minangkabau',
        shortDesc: 'Busana perempuan Minangkabau dengan tengkuluk tanduak (tanduk) yang menjulang.',
        description: 'Bundo Kanduang adalah busana adat perempuan Minangkabau yang terdiri atas baju kurung bersulam, kain songket, dan tengkuluk tanduak — hiasan kepala bertanduk menyerupai gonjong rumah gadang. Pemakainya adalah ibu kepala suku yang memegang harta pusaka.',
        philosophy: 'Tengkuluk tanduak menandai kekuasaan perempuan dalam matriarkat: rumah dan harta diwariskan kepada perempuan, sementara tanggung jawab adat diberikan pada laki-laki.',
        sources: [WIKI('Bundo Kanduang'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Talempong Pacik', region: 'Minangkabau',
        shortDesc: 'Empat gong kecil berkaki di atas dudukan, dimainkan dengan stik sambil duduk bersila.',
        description: 'Talempong Pacik adalah ansambel talempong empat nada — ting (nada rendah), tong, tang, ting (tinggi) — yang dimainkan di dudukan kayu dengan petabuh kayu. Talempong mengiringi tarian dan upacara adat Minangkabau.',
        philosophy: 'Empat nada talempong mewakili empat suku yang harus saling mengisi; tidak ada nada yang lebih penting dari yang lain.',
        model3d: 'talempong',
        playable: true,
        sounds: [
          { id: 'tm1', label: 'Ting', freq: 262, type: 'gamelan', note: '1' },
          { id: 'tm2', label: 'Tong', freq: 330, type: 'gamelan', note: '2' },
          { id: 'tm3', label: 'Tang', freq: 392, type: 'gamelan', note: '3' },
          { id: 'tm4', label: 'Ting (tinggi)', freq: 523, type: 'gamelan', note: '5' },
        ],
        melody: ['tm1', 'tm3', 'tm2', 'tm4', 'tm3', 'tm1', 'tm2', 'tm3', 'tm4', 'tm1'],
        parts: [
          { id: 'p1', name: 'Talempong (Kawan)', pos: [0, 1.0, 0], color: '#b08d3f', function: 'Empat gong kecil berbahan perunggu dengan penopang kaki.', philosophy: 'Keempat nada saling menopang — cermin musyawarah empat suku dalam adat Minang.' },
          { id: 'p2', name: 'Dudukan Kayu', pos: [0, 0.5, 0], color: '#8a5a2b', function: 'Rangka penyangga yang mengikat keempat talempong.', philosophy: 'Dudukan yang satu menandai satu tujuan meski suara berbeda.' },
          { id: 'p3', name: 'Petabuh', pos: [0.9, 0.9, 0.4], color: '#6b4f2e', function: 'Stik kayu untuk memukul talempong.', philosophy: 'Pukulan yang tepat menghadirkan harmoni — peribahasa raso jo pareso (dengan rasa dan pertimbangan).' },
        ],
        sources: [WIKI('Talempong'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Piring', region: 'Minangkabau',
        shortDesc: 'Penari memegang piring di kedua telapak sambil berputar penuh kelincahan.',
        description: 'Tari Piring dimainkan para penari dengan piring di kedua telapak tangan yang diketuk saat berputar, duduk, berdiri, sambil diiringi tabuh talempong dan bansi. Piring yang dipegang penuh beras disajikan kepada tamu atau dilempar ke lantai sebagai tanda selamat.',
        philosophy: 'Piring yang dipegang erat meski berputar cepat mengajarkan ketahanan menjaga amanah; piring yang dilempar melambangkan persembahan syukur yang tulus.',
        sources: [WIKI('Tari Piring'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Rendang', region: 'Minangkabau',
        shortDesc: 'Daging sapi dimasak berjam-jam dalam santan dan rempah hingga kering berwarna gelap.',
        description: 'Rendang adalah masakan daging sapi Minangkabau yang dimasak perlahan lebih dari empat jam dalam santan dan bumbu rempah hingga kering, berwarna hitam kecokelatan, dan tahan berminggu-minggu. CNN menempatkannya sebagai masakan paling enak di dunia pada 2011 dan 2017.',
        philosophy: 'Proses memasak rendang disebut merandang — kesabaran yang tidak boleh tergesa; rendang yang kering melambangkan kematangan diri dan kebijaksanaan.',
        sources: [WIKI('Rendang'), WBT],
      },
    ],
  },
  {
    name: 'DKI Jakarta', slug: 'dki-jakarta', island: 'jawa', capital: 'Jakarta',
    lat: -6.2, lng: 106.85, motto: 'Jaya Raya',
    description: 'Ibu kota negara di muara Sungai Ciliwung yang menjadi titik temu budaya Betawi, Sunda, Tionghoa, Arab, dan Melayu.',
    history: 'Jakarta bermula sebagai bandar Sunda Kelapa pada abad ke-5, lalu Jayakarta yang ditaklukkan Fatahillah pada 1527. VOC menjadikannya Batavia hingga kemerdekaan 1945 mengembalikan nama Jakarta. Budaya Betawi lahir dari pernikahan budaya para pendatang yang bermukim di pinggir kota lama.',
    traditions: 'Orkes gambang kromong dan lenong mengiringi hajatan warga Betawi; palang pintu (perayaan tujuh bulanan kehamilan) dan sunatan menjadi momen adat terbesar. Ondel-ondel menjadi pelindung desa dan maskot kota.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Rumah Kebaya', region: 'Betawi',
        shortDesc: 'Rumah panggung Betawi beratap limasan yang menyerupai kebaya yang terbuka lebar.',
        description: 'Rumah Kebaya adalah rumah panggung Betawi berbentuk persegi dengan atap limasan bertingkat yang melengkung seperti kerah kebaya. Terdiri atas tiga bagian: serambi depan (paseden), ruang tengah, dan dapur belakang, dengan kolong di bawah panggung.',
        philosophy: 'Atap yang melebar seperti kerah kebaya menjadi lambang keterbukaan masyarakat Betawi yang hangat menerima siapa pun; panggungnya menahan lembap dan banjir di muara sungai.',
        model3d: 'panggung:kebaya',
        parts: [
          { id: 'p1', name: 'Tiang Panggung', pos: [0, 0.6, 1.2], color: '#8a5a2b', function: 'Tiang penyangga yang mengangkat lantai dari tanah.', philosophy: 'Panggung tinggi melambangkan kewaspadaan hidup di tanah yang selalu diancam banjir dan lembap.' },
          { id: 'p2', name: 'Ruang Tengah', pos: [0, 1.7, 0], color: '#b98a56', function: 'Ruang utama untuk keluarga dan acara adat.', philosophy: 'Ruang yang terbuka untuk semua — kesederhanaan warga Betawi yang rajin menyapa.' },
          { id: 'p3', name: 'Atap Limasan', pos: [0, 2.7, 0], color: '#6b4f2e', function: 'Atap berbentuk limas dengan sisi empat yang melebar.', philosophy: 'Bentuknya menyerupai kerah kebaya — feminin, lembut, dan ramah seperti budaya tuannya.' },
        ],
        sources: [WIKI('Rumah Kebaya'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Kebaya Encim', region: 'Betawi',
        shortDesc: 'Kebaya brokat encim dengan kain panjang dan hiasan rambut sanggul cangklong.',
        description: 'Pakaian adat Betawi untuk pengantin perempuan adalah kebaya encim berbahan brokat dan renda dengan kain panjang bermotif; pengantin laki-laki mengenakan baju beskap hitam, celana panjang, dan topi konding. Hiasan sanggul cangklong dan gelang melengkapi busana.',
        philosophy: 'Pencampuran gaya Tionghoa-encim, Arab, dan Melayu pada busana Betawi mencerminkan kota asalnya yang multietnis; setiap pengantin menjadi potret Indonesia yang lebur.',
        sources: [WIKI('Kebaya'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Gambang Kromong', region: 'Betawi',
        shortDesc: 'Orkes campuran Betawi-Tionghoa: gambang kayu, kromong gong kecil, sukong, tehyan.',
        description: 'Gambang Kromong adalah ansambel Betawi yang memadukan gambang (alat tabuh bilah kayu) dan kromong (sepuluh gong kecil) dengan alat gesek tehyan dan sukong, suling, serta gendang. Musiknya mengiringi tari cokek dan hajatan warga.',
        philosophy: 'Nama yang memasangkan dua alat berbeda — kayu dan perunggu — menjadi wajah dari kota yang memadukan banyak budaya tanpa kehilangan jati diri.',
        model3d: 'kolintang:gambang',
        playable: true,
        sounds: [
          { id: 'g1', label: 'Gambang 1', freq: 262, type: 'wood', note: 'do' },
          { id: 'g2', label: 'Gambang 2', freq: 294, type: 'wood', note: 're' },
          { id: 'g3', label: 'Gambang 3', freq: 330, type: 'wood', note: 'mi' },
          { id: 'g4', label: 'Gambang 4', freq: 392, type: 'wood', note: 'sol' },
          { id: 'g5', label: 'Gambang 5', freq: 440, type: 'wood', note: 'la' },
          { id: 'g6', label: 'Gambang 6', freq: 523, type: 'wood', note: "do'" },
        ],
        melody: ['g1', 'g3', 'g4', 'g3', 'g5', 'g4', 'g3', 'g2', 'g1', 'g3', 'g2', 'g1'],
        parts: [
          { id: 'p1', name: 'Gambang (Bilah Kayu)', pos: [0, 0.95, 0], color: '#c8a15a', function: 'Bilah-bilah kayu suwaran yang dipukul dengan dua stik.', philosophy: 'Kayu yang dipukul dengan tepat menghasilkan nada — ketepatan dan kesabaran menjadi dasar musik yang baik.' },
          { id: 'p2', name: 'Kromong (Gong Kecil)', pos: [1.2, 0.85, 0], color: '#b08d3f', function: 'Sepuluh gong kecil yang diletakkan pada dudukan.', philosophy: 'Kromong yang bersahutan dengan gambang menggambarkan budaya asing yang menemukan rumahnya di Betawi.' },
          { id: 'p3', name: 'Dudukan', pos: [0, 0.4, 0.5], color: '#8a5a2b', function: 'Rangka kayu penopang gambang dan kromong.', philosophy: 'Dudukan yang satu mempersatukan dua dunia bunyi.' },
        ],
        sources: [WIKI('Gambang kromong'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Topeng Betawi', region: 'Betawi',
        shortDesc: 'Dua penari bertopeng lilin dan panji bergantian dengan gerak cepat dan lincah.',
        description: 'Tari Topeng Betawi dimainkan dua penari dengan topeng (satu topeng lilin muka garebek, satu topeng panji) yang bergantian dalam iringan gambang kromong. Gerakannya cepat dan dinamis, sering dipertunjukkan di jalan saat pesta sunatan.',
        philosophy: 'Topeng yang menutupi muka mengajarkan: nilai seseorang bukan pada wajahnya melainkan pada gerak dan hatinya.',
        sources: [WIKI('Tari Topeng Betawi'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Kerak Telor', region: 'Betawi',
        shortDesc: 'Omelet nasi ketan dengan telur bebek, ebi kering, dan kelapa sangrai.',
        description: 'Kerak Telor adalah makanan khas Betawi berbahan nasi ketan, telur bebek, ebi kering, dan serundeng kelapa yang dimasak di atas bara dengan wajan tanpa minyak. Hidangan ini selalu hadir di festival Betawi dan car free day.',
        philosophy: 'Resep yang diwariskan lintas generasi tanpa banyak berubah menjadi simbol betapa Betawi menghargai warisan dari zaman kolonial.',
        sources: [WIKI('Kerak telor'), WBT],
      },
    ],
  },
  {
    name: 'Jawa Barat', slug: 'jawa-barat', island: 'jawa', capital: 'Bandung',
    lat: -6.9, lng: 107.6, motto: 'Gemah Ripah Repeh Rapih',
    description: 'Tanah Sunda dari Ujung Kulon hingga kaki Gunung Ciremai, kaya akan seni kliningan, angklung, dan kuliner tanah pegunungan.',
    history: 'Kerajaan Sunda Pajajaran (abad 7–16) memerintah tanah Sunda dengan pusat di Pakuan Pajajaran (Bogor). Kerajaan ini terkenal dengan perdagangan lada dan hubungan diplomatik dengan Portugal. Sumedang Larang dan Cirebon memperkaya keberagaman budaya Sunda-nya.',
    traditions: 'Adat Sunda menjunjung "silih asah, silih asih, silih asuh" (saling mendidik, saling menyayangi, saling menumbuhkan). Seni bela diri pencak silat, angklung buhun, dan kliningan menjadi media penanaman nilai tersebut.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Imah Julang Ngapak', region: 'Sunda',
        shortDesc: 'Rumah panggung Sunda dengan atap limasan bersayap melengkung seperti terbang ngapak.',
        description: 'Imah Julang Ngapak adalah rumah adat Sunda berlantai panggung dengan atap limasan yang sayapnya melengkung naik di kedua ujung — seperti burung yang sedang terbang ngapak. Struktur kayu menyatu tanpa paku dengan tangga di sisi depan.',
        philosophy: 'Sayap atap yang "terbang" mengajarkan agar penghuninya selalu berpikir maju dan berbakti; panggungnya menjaga keseimbangan antara dunia bawah dan atas.',
        model3d: 'panggung:julang',
        parts: [
          { id: 'p1', name: 'Sokel', pos: [0, 0.6, 1.3], color: '#8a5a2b', function: 'Kaki panggung kayu yang mengangkat rumah dari tanah.', philosophy: 'Simbol kewaspadaan terhadap bencana dan binatang — hidup yang selalu waspada.' },
          { id: 'p2', name: 'Imah Tengah', pos: [0, 1.8, 0], color: '#b98a56', function: 'Ruang utama rumah tempat keluarga berkumpul.', philosophy: 'Ruang tengah menjadi titik kumpul keluarga — kehangatan rumah orang Sunda.' },
          { id: 'p3', name: 'Julang (Sayap Atap)', pos: [0, 3.0, 0], color: '#6b4f2e', function: 'Ujung sayap atap yang melengkung ke atas.', philosophy: 'Bentuk terbang ngapak menjadi harapan agar penghuni selalu menempa diri dan berilmu.' },
        ],
        sources: [WIKI('Rumah adat Jawa Barat'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Pakaian Adat Sunda', region: 'Sunda',
        shortDesc: 'Kebaya dan sarung kebaya dengan badong dan jénggot, tengkuluk mangkuk untuk laki-laki.',
        description: 'Pakaian adat Sunda perempuan: kebaya panjang berhias badong (rantai dada) dan jénggot, dengan kain batik atau lurik; laki-laki mengenakan baju pangsi hitam atau beskap dengan ikat pinggang sumping dan tengkuluk mangkuk.',
        philosophy: 'Warna kain yang sederhana dan aksesori badong yang berhias manik menggambarkan keseimbangan keindahan dan kesopanan yang menjadi sandaran perempuan Sunda.',
        sources: [WIKI('Pakaian adat Sunda'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Angklung', region: 'Sunda',
        shortDesc: 'Alat musik bambu rangka ganda yang dibunyikan dengan digoyang, warisan dunia UNESCO 2010.',
        description: 'Angklung adalah alat musik bambu yang dibunyikan dengan digoyangkan; setiap angklung menghasilkan satu nada sehingga harus dimainkan bersama-sama. UNESCO menetapkannya sebagai Warisan Budaya Takbenda pada 2010. Daeng Soetigna memodifikasinya ke laras diatonis pada 1938.',
        philosophy: 'Satu pemain satu nada mengajarkan bahwa tak ada satu pun orang yang bisa bermain sendiri — keharmonisan lahir dari gotong royong.',
        model3d: 'angklung',
        playable: true,
        sounds: [
          { id: 'a1', label: 'Do', freq: 262, type: 'bamboo', note: 'do' },
          { id: 'a2', label: 'Mi', freq: 330, type: 'bamboo', note: 'mi' },
          { id: 'a3', label: 'Sol', freq: 392, type: 'bamboo', note: 'sol' },
          { id: 'a4', label: "Do'", freq: 523, type: 'bamboo', note: "do'" },
        ],
        melody: ['a1', 'a2', 'a3', 'a4', 'a3', 'a2', 'a1', 'a3', 'a4', 'a1'],
        parts: [
          { id: 'p1', name: 'Tabung Bambu', pos: [0, 1.15, 0], color: '#a8c686', function: 'Dua tabung bambu bercabang per nada yang bergetar saat digoyang.', philosophy: 'Bambu yang diambil dengan doa dan ditanam dengan harapan — alat yang hidup bersama tanamannya.' },
          { id: 'p2', name: 'Rangka Kayu', pos: [0, 0.5, 0.3], color: '#8a5a2b', function: 'Kerangka penyangga tabung bambu.', philosophy: 'Rangka yang kokoh menopang tabung — fondasi bersama yang menjaga seluruh nada tetap berbunyi.' },
          { id: 'p3', name: 'Simpai Pengikat', pos: [0, 1.4, 0], color: '#6b4f2e', function: 'Tali rotan pengikat tabung ke rangka.', philosophy: 'Pengikat yang lentur tetapi kuat — persahabatan yang mengikat tanpa menyekung.' },
        ],
        sources: [WIKI('Angklung'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Jaipongan', region: 'Sunda',
        shortDesc: 'Tari rakyat Sunda yang dinamis dengan gerak tangkisan silat dan irama degung.',
        description: 'Jaipongan lahir pada 1970-an dari karya Gugum Gumbira dengan menggabungkan gerak penca (silat), ketuk tilu, dan ronggeng. Penari perempuan menampilkan gerak selendang yang lentur dengan tatapan mata yang tajam diiringi degung.',
        philosophy: 'Jaipongan mengajarkan kegembiraan dan ketegasan hati; gerak tangkisnya menyisipkan ilmu pencak silat sebagai pembelaan diri.',
        sources: [WIKI('Jaipongan'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Nasi Timbel', region: 'Sunda',
        shortDesc: 'Nasi putih yang digulung daun pisang panas dengan sambal dadak dan sayur asem.',
        description: 'Nasi Timbel adalah nasi putih yang dibungkus daun pisang dan dikukus hingga harum; disajikan dengan sambal dadak, sayur asem, tahu tempe, dan ikan asin. Aromanya keluar saat daun pisang dibuka sebelum dimakan.',
        philosophy: 'Pembungkusan daun pisang yang membawa aroma masakan menggambarkan kearifan memanfaatkan alam; makan bersama dilakukan dengan tangan sebagai simbol kerendahan hati.',
        sources: [WIKI('Nasi timbel'), WBT],
      },
    ],
  },
  {
    name: 'Jawa Tengah', slug: 'jawa-tengah', island: 'jawa', capital: 'Semarang',
    lat: -7.0, lng: 110.42, motto: 'Prasetya Ulah Sakti Bhakti Praja',
    description: 'Jantung Jawa dengan keraton Surakarta dan Mangkunegaran, ladang padi, dan tradisi gamelan yang menyebar ke seluruh dunia.',
    history: 'Mataram Kuno dan Mataram Islam berpusat di tanah Jawa Tengah; perjanjian Giyanti 1755 membelahnya menjadi Surakarta dan Yogyakarta. Keraton-keraton ini menjadi pusat penyebaran adat Jawa, sastra, dan gamelan. Budaya alus (halus) dan etika unggah-ungguh menjadi ciri khasnya.',
    traditions: 'Upacara sekaten dan labuhan di keraton menghidupkan syukur kepada Tuhan dan leluhur; sedekah bumi di desa-desa menjadi momen bersyukur panen. Wayang kulit dan kethoprak menyampaikan pesan moral kepada masyarakat.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Joglo', region: 'Jawa',
        shortDesc: 'Rumah adat Jawa dengan empat soko guru dan atap tumpang sari yang menjulang.',
        description: 'Joglo adalah rumah adat Jawa Tengah yang terdiri atas pendopo dan dalem. Empat soko guru di tengah menopang atap bertingkat (tumpang sari), sementara umpak batu menopang setiap tiang. Ruangnya dibagi: sentong tengah, pringgitan, dan pawedan.',
        philosophy: 'Empat soko guru melambangkan empat rukun hidup — keluarga, tetangga, masyarakat, dan Tuhan — yang menopang rumah tangga. Tumpang sari yang menjulang melambangkan puncak budi manusia yang harus dicapai dengan kesabaran.',
        model3d: 'joglo',
        parts: [
          { id: 'p1', name: 'Soko Guru', pos: [0, 1.1, 0], color: '#8a5a2b', function: 'Empat tiang utama di tengah rumah.', philosophy: 'Simbol empat rukun hidup: keluarga, tetangga, masyarakat, dan Tuhan.' },
          { id: 'p2', name: 'Umpak (Seksak)', pos: [0, 0.15, 1.3], color: '#9a9a8f', function: 'Alas batu penopang tiang kayu.', philosophy: 'Batu yang kuat di bawah kayu — dasar yang mantap sebelum membangun yang tinggi.' },
          { id: 'p3', name: 'Tumpang Sari', pos: [0, 3.1, 0], color: '#6b4f2e', function: 'Atap bertingkat di tengah rumah di atas soko guru.', philosophy: 'Tingkat yang naik mewakili puncak spiritual manusia; hanya yang paling dalam yang boleh masuk.' },
          { id: 'p4', name: 'Pringgitan (Empyak)', pos: [0, 2.5, 1.5], color: '#b98a56', function: 'Serambi atas tempat wayang dipertunjukkan.', philosophy: 'Pringgitan menjadi penghubung antara dunia luar dan dalam — tahap belajar sebelum maju.' },
        ],
        sources: [WIKI('Joglo'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Pakaian Adat Jawa (Basahan & Kanigaran)', region: 'Jawa',
        shortDesc: 'Beskap hitam dengan blangkon untuk laki-laki, kebaya jarik kanigaran untuk perempuan.',
        description: 'Pakaian adat Jawa Tengah laki-laki: beskap hitam berhias kelat bahu, kain jarik bermotif parang, blangkon, dan keris; perempuan: kebaya kanigaran dengan jarik, sanggul Jawa, dan cindai. Untuk keluarga keraton digunakan basahan dengan aksesori keris lengkap.',
        philosophy: 'Blangkon yang membungkung kepala melambangkan penguasaan diri; jarik yang melilit kaki mengajarkan langkah yang harus dijaga agar tidak salah jalan.',
        sources: [WIKI('Pakaian adat Jawa'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Saron (Gamelan)', region: 'Jawa',
        shortDesc: 'Bilah perunggu di atas palungan kayu, nada dasar gamelan pelog.',
        description: 'Saron adalah alat musik gamelan Jawa berupa tujuh bilah perunggu di atas palungan kayu yang dipukul dengan tabuh kayu. Nada saron mengikuti laras pelog — 1, 2, 3, 5, 6 — dan menjadi pengiring utama balungan dalam gendhing.',
        philosophy: 'Bilah saron yang bergetar bersama palungan mengajarkan bahwa suara yang dihasilkan harus diberi tempat beristirahat (irah-irahan) — setiap nada memiliki rumah.',
        model3d: 'saron',
        playable: true,
        sounds: [
          { id: 'n1', label: '1 (ji)', freq: 262, type: 'gamelan', note: '1' },
          { id: 'n2', label: '2 (ro)', freq: 294, type: 'gamelan', note: '2' },
          { id: 'n3', label: '3 (lu)', freq: 330, type: 'gamelan', note: '3' },
          { id: 'n5', label: '5 (ma)', freq: 392, type: 'gamelan', note: '5' },
          { id: 'n6', label: '6 (nem)', freq: 440, type: 'gamelan', note: '6' },
        ],
        melody: ['n1', 'n2', 'n3', 'n5', 'n6', 'n5', 'n3', 'n2', 'n1', 'n2', 'n3', 'n2', 'n1'],
        parts: [
          { id: 'p1', name: 'Wilah (Bilah Perunggu)', pos: [0, 0.85, 0], color: '#b08d3f', function: 'Bilah perunggu yang dipukul menghasilkan nada.', philosophy: 'Perunggu yang dicetak dengan doa oleh empu — setiap bilah dianggap memiliki jiwa.' },
          { id: 'p2', name: 'Palungan (Wadah)', pos: [0, 0.45, 0], color: '#8a5a2b', function: 'Palungan kayu tempat bilah diletakkan.', philosophy: 'Kayu yang menggetarkan bersama bilah — badan dan jiwa yang menyatu.' },
          { id: 'p3', name: 'Pencu', pos: [-1.5, 0.85, 0], color: '#a1743f', function: 'Penahan di kedua ujung bilah.', philosophy: 'Pencu menjaga bilah tetap pada tempatnya — batas adat yang menjaga keselamatan.' },
          { id: 'p4', name: 'Tabuh', pos: [1.7, 0.8, 0.35], color: '#6b4f2e', function: 'Tabuh kayu untuk memukul wilah.', philosophy: 'Tabuh yang ditekuk ringan menghasilkan nada lembut — kelembutan dalam memukul.' },
        ],
        sources: [WIKI('Saron'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Serimpi', region: 'Jawa (Keraton)',
        shortDesc: 'Tari keraton Surakarta empat penari berbaju putih dengan aksen sumping praba.',
        description: 'Serimpi adalah tarian klasik keraton yang dimainkan empat penari perempuan dengan kostum putih-emas, sumping praba di telinga, dan keekspresian mata yang halus. Gerakannya lambat, gemetar, dan penuh simbol — serimpi berarti "ratu pembawa keseimbangan dunia".',
        philosophy: 'Empat penari melambangkan empat elemen: air, angin, tanah, api — keseimbangan alam yang dipertahankan oleh keraton sebagai titik dunia.',
        sources: [WIKI('Serimpi'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Lumpia Semarang', region: 'Semarang',
        shortDesc: 'Gulungan kulit lumpia isi rebung, telur, dan udang dengan saus manis.',
        description: 'Lumpia Semarang adalah hidangan peranakan Tionghoa-Jawa berupa gulungan kulit tipis berisi rebung, telur, udang, dan ayam, disajikan dengan saus manis gurih. Kini menjadi oleh-oleh ikonik Semarang.',
        philosophy: 'Perpaduan bahan Jawa dengan teknik masak Tionghoa menjadi potret akulturasi di bandar Semarang — budaya yang berbaur tanpa kehilangan rasa.',
        sources: [WIKI('Lumpia Semarang'), WBT],
      },
    ],
  },
  {
    name: 'DI Yogyakarta', slug: 'yogyakarta', island: 'jawa', capital: 'Yogyakarta',
    lat: -7.8, lng: 110.36, motto: 'Kejawen Mataram',
    description: 'Provinsi istimewa yang diperintah Sultan Hamengku Buwono dan Paku Alam, pusat budaya Mataram Islam dan warisan dunia Prambanan-Borobudur.',
    history: 'Kerajaan Yogyakarta didirikan Sultan Hamengku Buwono I pada 1755 setelah perjanjian Giyanti membelah Mataram. Keraton menjadi pusat budaya Jawa yang memelihara seni batik, wayang, dan gamelan. Daerah Istimewa Yogyakarta lahir pada 1950 dengan status khusus karena jasa sultan dalam perjuangan kemerdekaan.',
    traditions: 'Adat kraton menjaga keseimbangan antara pepoyan (alam), pelataran (masyarakat), dan urip (kehidupan). Upacara sekaten, labuhan, dan grebeg maulid diadakan secara rutin; batik dan wayang kulit menjadi identitas yang diakui UNESCO.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Joglo Dalem Ageng', region: 'Jawa (Keraton)',
        shortDesc: 'Joglo keraton yang paling sakral, tempat putera raja dilantik dan disemayamkan.',
        description: 'Joglo Dalem Ageng (Dalem Ageng Prabasuyasa) adalah bangunan utama keraton Yogyakarta yang menjadi kediaman dan tempat persemayaman raja. Arsitekturnya joglo sempurna dengan soko guru, tumpang sari, dan sentong raja di tengah ruang.',
        philosophy: 'Dalem Ageng adalah poros dunia kraton: sentong tengah tempat raja bersemayam dianggap titik pusat alam semesta; bagian selatan (kemagangan) tempat naik tahta.',
        model3d: 'joglo',
        parts: [
          { id: 'p1', name: 'Soko Guru', pos: [0, 1.1, 0], color: '#7a4a1f', function: 'Empat tiang utama penopang tumpang sari.', philosophy: 'Empat soko guru dianggap empat sahabat keraton yang menopang kerajaan.' },
          { id: 'p2', name: 'Sentong Raja', pos: [0, 1.5, -0.5], color: '#8a5a2b', function: 'Ruang tengah tempat raja bersemayam dan upacara pernikahan.', philosophy: 'Titik pusat alam semesta — di sanalah keputusan kerajaan dan upacara adat diadakan.' },
          { id: 'p3', name: 'Tumpang Sari', pos: [0, 3.1, 0], color: '#5e4527', function: 'Atap bertingkat yang diukir penuh ornamen emas.', philosophy: 'Puncak spiritual — hanya yang paling terhormat yang boleh berada di bawahnya.' },
          { id: 'p4', name: 'Pawedan', pos: [0, 1.8, 1.4], color: '#a1743f', function: 'Pelataran dalam tempat raja dilantik dan menerima penghormatan.', philosophy: 'Tempat menapak dengan kaki telanjang — kesucian saat menerima amanah.' },
        ],
        sources: [WIKI('Kraton Yogyakarta'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Beskap Ageng Kraton', region: 'Jawa (Keraton)',
        shortDesc: 'Beskap ageng dengan kelat bahu emas, dodot, dan blangkon gula kelapa.',
        description: 'Pakaian kebesaran kraton Yogyakarta adalah beskap ageng berhias kelat bahu emas dengan dodot (kain panjang yang dilipat khusus), blangkon gula kelapa, dan keris gambar. Untuk upacara parangkusumo digunakan kostum pahlawan perang lengkap.',
        philosophy: 'Dodot yang dilipat mengikuti aturan yang ketat menjadi lambang aturan adat yang menuntun hidup; keris yang dipakai di pinggang melambangkan watak yang tidak boleh lupa asal-usul.',
        sources: [WIKI('Beskap'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Gong Suwukan (Gamelan Sekaten)', region: 'Keraton Yogyakarta',
        shortDesc: 'Gong besar gamelan sekaten yang dibunyikan untuk membuka dan menutup gendhing.',
        description: 'Gong Suwukan adalah gong besar dari gamelan sekaten (Kyai Guntur Sari dan Kyai Gunturmadu) yang dibunyikan pada awal dan akhir setiap gendhing saat perayaan sekaten. Gamelan sekaten ini hanya dibunyikan pada masa perayaan Maulid Nabi.',
        philosophy: 'Bunyi gong yang paling akhir mengajarkan: pekerjaan yang baik harus dituntaskan sampai akhir dengan bunyi yang paling dalam.',
        model3d: 'gong',
        playable: true,
        sounds: [
          { id: 'gn1', label: 'Gong', freq: 98, type: 'gong', note: 'Dummm' },
        ],
        melody: ['gn1', 'gn1', 'gn1'],
        parts: [
          { id: 'p1', name: 'Badan Gong', pos: [0, 1.1, -0.2], color: '#b08d3f', function: 'Pelat perunggu besar yang digantung pada rangka.', philosophy: 'Bunyi gong yang menggema panjang menjadi doa yang dibawa sampai ke penjuru alam.' },
          { id: 'p2', name: 'Bumbung (Pusar)', pos: [0, 1.12, 0.18], color: '#9a7528', function: 'Benjolan pusat gong tempat tabuh menghantam.', philosophy: 'Pusat gong adalah pusat alam — segala gendhing bermula dan berakhir dari sana.' },
          { id: 'p3', name: 'Bumbungan Kayu', pos: [0, 0.6, 1.2], color: '#8a5a2b', function: 'Rangka kayu penyangga gong besar.', philosophy: 'Rangka yang menopang gong — fondasi adat yang menjaga budaya tetap berbunyi.' },
        ],
        sources: [WIKI('Sekaten'), WBT],
      },
      {
        category: 'TARIAN', name: 'Tari Golek Ayun-ayun', region: 'Keraton Yogyakarta',
        shortDesc: 'Tari perempuan keraton dengan gerak golek halus dan riasan busana putri.',
        description: 'Golek Ayun-ayun adalah tarian keraton Yogyakarta yang dimainkan seorang penari perempuan dengan busana putri yang berkilau, sumping mungkur, dan gerak golek (ayun) yang sangat halus. Tari ini menampilkan keseimbangan antara keindahan dan kekhusyukan.',
        philosophy: 'Golek yang bermakna "ayun" mengajarkan agar hidup seperti ayunan yang teratur — kelembutan yang tetap punya arah dan tujuan.',
        sources: [WIKI('Tari Golek'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Gudeg Yogya', region: 'Yogyakarta',
        shortDesc: 'Nangka muda dimasak santan dan gula aren semalaman, disajikan dengan krecek dan telur.',
        description: 'Gudeg adalah hidangan nangka muda yang dimasak lebih dari sepuluh jam dalam santan, gula aren, dan bumbu rempah hingga berwarna cokelat gelap; disajikan dengan krecek (sambal kulit melinjo), telur, dan ayam. Gudeg menjadi identitas kulinernya Yogyakarta.',
        philosophy: 'Proses memasak yang panjang menjadi lambang kesabaran dan ketekunan hidup orang Jawa; rasa yang manis-gurih menggambarkan keseimbangan hidup yang diidamkan.',
        sources: [WIKI('Gudeg'), WBT],
      },
    ],
  },
  {
    name: 'Jawa Timur', slug: 'jawa-timur', island: 'jawa', capital: 'Surabaya',
    lat: -7.25, lng: 112.75, motto: 'Jer Basuki Mawa Beya',
    description: 'Tanah Kerajaan Majapahit di timur Pulau Jawa, dengan budaya Madura, Osing, Tengger, dan Samin yang kaya dan berbeda-beda.',
    history: 'Kerajaan Majapahit (1293–1527) di Trowulan menjadi kerajaan terbesar di Nusantara dengan pusat ekonomi di muara sungai Brantas. Gajah Mada menyatukan hampir seluruh Nusantara di bawah Majapahit. Budaya Madura di timur dan Osing di Banyuwangi memperkaya identitas provinsi ini.',
    traditions: 'Tradisi "jer basuki mawa beya" (mencapai keselamatan membutuhkan pengorbanan) menjadi sandaran hidup masyarakat Jawa Timur. Reog Ponorogo dan tari gandrung menjadi media hiburan dan ritual; adat Osing menjaga bahasa dan kesenian unik mereka.',
    items: [
      {
        category: 'RUMAH_ADAT', name: 'Rumah Adat Osing (Taman Sari)', region: 'Osing, Banyuwangi',
        shortDesc: 'Rumah panggung Osing dengan atap tinggi dan bagian samping bergerigi yang khas.',
        description: 'Rumah adat Osing di desa Kemiren, Banyuwangi, berlantai panggung dengan atap runcing yang tinggi dan bagian samping yang bergerigi (sinom apit). Materialnya kayu ulin dan bambu dengan ukiran khas Blambangan.',
        philosophy: 'Bentuk rumah yang menjulang dan gerigi di sisi atapnya melambangkan tanggung jawab yang dijaga dengan ketat — rumah sebagai benteng keluarga Blambangan.',
        model3d: 'panggung:osing',
        parts: [
          { id: 'p1', name: 'Monting', pos: [0, 0.6, 1.2], color: '#8a5a2b', function: 'Tiang panggung penopang rumah.', philosophy: 'Tiang yang ditanam dengan upacara — fondasi yang dihadirkan dengan doa.' },
          { id: 'p2', name: 'Batur', pos: [0, 1.6, 0], color: '#b98a56', function: 'Ruang utama rumah tempat keluarga berkumpul.', philosophy: 'Ruang yang dijaga bersama — rumah Osing adalah rumah besar keluarga.' },
          { id: 'p3', name: 'Tatanan (Atap)', pos: [0, 2.7, 0], color: '#6b4f2e', function: 'Atap runcing dengan gerigi di sisi samping.', philosophy: 'Gerigi yang menanjak menjadi lambang tangga naik yang harus dilalui dengan sabar.' },
        ],
        sources: [WIKI('Rumah adat Osing'), WBT],
      },
      {
        category: 'PAKAIAN_ADAT', name: 'Pakaian Adat Madura (Pesapen)', region: 'Madura',
        shortDesc: 'Pesapen hitam berhias sulaman untuk laki-laki, kebaya dalem jarik untuk perempuan.',
        description: 'Pakaian adat Madura laki-laki adalah pesapen: baju hitam panjang berhias sulaman tangan, celana panjang, sarung, dan destar; perempuan mengenakan kebaya dalem dengan jarik bermotif madurese dan hiasan kepala sanggul.',
        philosophy: 'Warna hitam pesapen menjadi lambang kesederhanaan dan keteguhan hati orang Madura; sulaman yang rapat menggambarkan ketelitian kerajinan tangan mereka.',
        sources: [WIKI('Pakaian adat Madura'), WBT],
      },
      {
        category: 'ALAT_MUSIK', name: 'Gandrang', region: 'Madura',
        shortDesc: 'Gendang silindris besar dari kayu yang dimainkan dengan dua tangan, otak irama gandrung.',
        description: 'Gandrang adalah gendang besar berbentuk silindris dari kayu khas Madura yang dimainkan dengan kedua telapak tangan, menjadi otak irama tari gandrung dan seni jaranan. Gendang ini diletakkan pada bahu dengan tali selempang.',
        philosophy: 'Irama gandrang yang menghentak menggambarkan semangat hidup yang tidak boleh menyerah — gendang yang menggiring langkah penari.',
        model3d: 'kendang:gandrang',
        playable: true,
        sounds: [
          { id: 'kd1', label: 'Dum', freq: 165, type: 'drum', note: 'Dum', param: 'low' },
          { id: 'kd2', label: 'Tak', freq: 392, type: 'drum', note: 'Tak', param: 'high' },
          { id: 'kd3', label: 'Slap', freq: 294, type: 'drum', note: 'Syat', param: 'slap' },
        ],
        melody: ['kd1', 'kd2', 'kd1', 'kd2', 'kd3', 'kd2', 'kd1', 'kd3', 'kd2', 'kd1'],
        parts: [
          { id: 'p1', name: 'Kepala Besar', pos: [-0.7, 0.8, 0], color: '#d9c49a', function: 'Membran besar yang menghasilkan bunyi rendah (dum).', philosophy: 'Bunyi yang dalam menjadi fondasi irama — dasar yang harus diletakkan lebih dulu.' },
          { id: 'p2', name: 'Kepala Kecil', pos: [0.7, 0.8, 0], color: '#e6d7b8', function: 'Membran kecil untuk bunyi tinggi (tak).', philosophy: 'Bunyi yang tinggi menandakan waktunya melangkah — aba-aba perubahan.' },
          { id: 'p3', name: 'Badan Gandrang', pos: [0, 0.75, 0], color: '#8a5a2b', function: 'Badan kayu yang menyatukan dua membran dengan tali.', philosophy: 'Kayu yang diukir dengan hiasan menjadi lambang keindahan yang dibawa dalam keseharian.' },
        ],
        sources: [WIKI('Gandrung'), WBT],
      },
      {
        category: 'TARIAN', name: 'Reog Ponorogo', region: 'Ponorogo',
        shortDesc: 'Seni barongan dengan kepala singa dadak merak yang beratnya hingga 60 kg.',
        description: 'Reog Ponorogo adalah seni pertunjukan barongan yang menampilkan kepala singa (barongan dadak merak) yang diusung seorang warok dengan gigi — beratnya bisa mencapai 60 kilogram. Didampingi jathilan (penunggang kuda) dan gemblak, diiringi gendang kempul dan angklung.',
        philosophy: 'Barongan melambangkan kekuatan pemimpin yang harus dipikul dengan tanggung jawab; warok yang memikul barongan menjadi lambang pengorbanan untuk menjaga adat.',
        sources: [WIKI('Reog'), WBT],
      },
      {
        category: 'MAKANAN', name: 'Rawon', region: 'Jawa Timur',
        shortDesc: 'Soto berkuah hitam dari kluwek dengan daging sapi dan taoge pendek.',
        description: 'Rawon adalah masakan berkuah hitam khas Jawa Timur yang berasal dari kluwek (kepayang) yang digiling; disajikan dengan daging sapi, taoge pendek, telur asin, dan sambal terasi. Rawon dikenal sebagai salah satu masakan tertua di Nusantara.',
        philosophy: 'Kluwek yang harus digiling dan dimasak lama agar tidak pahit mengajarkan kesabaran; kuah hitam yang menyatukan semua bahan melambangkan persatuan yang menghimpun perbedaan.',
        sources: [WIKI('Rawon'), WBT],
      },
    ],
  },
]
