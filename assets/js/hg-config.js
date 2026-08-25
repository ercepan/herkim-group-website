/* ============================================================
   HERKİM — Backend yapılandırması
   Bu iki değer HERKESE AÇIKTIR ve öyle olmalıdır; güvenlik
   anahtarla değil, veritabanındaki satır seviyesi politikalarla
   sağlanır. service_role anahtarı BURAYA ASLA YAZILMAZ.

   Boş bırakılırsa site bugünkü yerel (demo) modunda çalışır.
   ============================================================ */
window.HG_CONFIG = {
  url: "",        // örn. https://xxxxxxxx.supabase.co
  anonKey: "",    // Supabase panelindeki "anon / publishable" anahtarı
  demo: true      // true iken backend bağlı olsa bile yerel demo kullanılır
};
