// Bootstrap script to initialize LaCavData when external scripts fail to load
// This ensures the data layer is available for the main script.js

if (!window.LaCavData) {
  window.LaCavData = {
    list: async function(kind, publicOnly = false) {
      const localStorage_key = "lacav-v2-data";
      let data = localStorage.getItem(localStorage_key);
      
      if (!data) {
        // Initialize default data
        const initialCategories = ["Mobilier", "Objets d'art", "Bijoux", "Accessoires"];
        const initialProducts = [
          ["lampe-lin", "Lampe de bureau — Lin et laiton", "Mobilier", 6500, "Bon état", "assets/images/interior.jpg", "Une lampe au dessin épuré dont l'abat-jour en lin crème diffuse une lumière chaleureuse. Base en laiton patiné. Années 1970. Fonctionne parfaitement.", true, "Pièce unique"],
          ["tabouret-rotin", "Tabouret bas — Rotin tressé", "Mobilier", 7500, "Très bon état", "assets/images/chair.jpg", "Un tabouret aux formes organiques, revêtu de rotin tissé à la main. Structure bois naturel. Environ années 1960. Stable et robuste.", true, "Pièce unique"],
          ["guéridon-acajou", "Guéridon — Acajou massif", "Mobilier", 15000, "Restauré", "assets/images/interior.jpg", "Une petite table d'appoint au plateau circulaire en acajou massif. Restaurée avec soin, vernis d'époque conservé. Très début XXe siècle.", false, "Pièce unique"],
          ["fauteuil-velours", "Fauteuil — Velours citron", "Mobilier", 32000, "Très bon état", "assets/images/interior.jpg", "Un fauteuil aux lignes épurées, recouvert d'un velours citron vibrant. Accoudoirs en bois teinté. Années 1960, structure solide.", false, "Pièce unique"],
          ["vase-ceramique", "Vase — Céramique artisanale", "Objets d'art", 4800, "Bon état", "assets/images/objects.jpg", "Un vase tourné et émaillé à la main par un artisan céramiste. Teintes naturelles inspirées de la terre. Hauteur 28 cm. Craquelures de cuisson recherchées.", true, "Artisanat"],
          ["miroir-soleil", "Miroir mural — Cadre doré", "Objets d'art", 8900, "Très bon état", "assets/images/interior.jpg", "Un miroir aux formes géométriques épurées, cadre en bois doré à la feuille. Années 1970. 60 cm de diamètre. Élégant et lumineux.", false, "Pièce unique"],
          ["cadre-or", "Cadre en bois — Feuille d'or patiné", "Objets d'art", 2500, "Bon état", "assets/images/interior.jpg", "Un cadre classique aux proportions généreuses, bois teinté et filet doré. Format 40 × 50 cm. Sans passe-partout ni vitre.", true, "Pièce unique"],
          ["sculptute-bronze", "Sculpture — Bronze abstraite", "Objets d'art", 24000, "Restaurée", "assets/images/objects.jpg", "Une figure abstraite en bronze massif, patine vert-de-gris d'époque. Numérotée et signée. Années 1950. Poids environ 8 kg.", false, "Pièce unique"],
          ["boucles-or", "Boucles d'oreilles — Or et perles", "Bijoux", 8900, "Très bon état", "assets/images/jewelry.jpg", "Une paire délicate en or jaune 750/1000, ornée de perles de culture. Fermoirs sécurisés. Poinçon français. Fin XIXe siècle. Certificat d'authenticité.", false, "Pièce unique"],
          ["collier-argent", "Collier — Chaîne argent massif", "Bijoux", 3600, "Bon état", "assets/images/jewelry.jpg", "Une chaîne en argent massif poinçonné 925, maillon forcats épais. Longueur 60 cm, ajustable. Très bien conservée, poids 18 g.", true, "Pièce unique"],
          ["bague-turquoise", "Bague — Turquoise et laiton", "Bijoux", 5400, "Bon état", "assets/images/jewelry.jpg", "Une bague ornée d'une turquoise naturelle cabochon, monture en laiton travaillé. Travail artisanal, années 1970. Taille 54 français.", true, "Artisanat"],
          ["montre-acier", "Montre de poignet — Acier brossé", "Bijoux", 12000, "Très bon état", "assets/images/watch.jpg", "Une montre automatique au cadran blanc, boîtier acier, bracelet cuir brun vintage. Marque suisse, années 1980. Fonctionne précisément.", false, "Pièce unique"],
          ["lunettes-soleil", "Lunettes de soleil — Monture miel", "Accessoires", 4500, "Très bon état", "assets/images/objects.jpg", "Une monture ovale en acétate miel tendre, verres teinté ambre d'époque. Années 1990. Très bon état, légère patine du temps.", true, "Pièce unique"],
          ["echarpe-cachemire", "Écharpe — Cachemire ivoire", "Accessoires", 6700, "Très bon état", "assets/images/fashion.jpg", "Une grande écharpe en cachemire fin, teinte ivoire crème. Frange main. Tissage très serré, douceur exceptionnelle. Marque réputée italienne.", false, "Pièce unique"],
          ["ceinture-cuir", "Ceinture — Cuir travaillé et laiton", "Accessoires", 2800, "Bon état", "assets/images/interior.jpg", "Une ceinture en cuir naturel tressé à la main, boucle en laiton forgé. Travail artisanal français. Réglable 75-95 cm. Usure légère naturelle.", true, "Artisanat"],
          ["sac-cuir-marron", "Sac à main — Cuir marron caramel", "Accessoires", 11500, "Très bon état", "assets/images/fashion.jpg", "Un sac de luxe en cuir végétal tannée naturellement, monnaie cuivre doré. Poignées robustes, intérieur doublé. Marque française, années 2000. Très peu porté.", false, "Pièce unique"]
        ];
        
        const defaultData = {
          categories: initialCategories.map((name, i) => ({ id: ["mobilier", "objets-art", "bijoux", "accessoires"][i], name })),
          products: initialProducts.map(([id, title, category, priceCents, condition, image, description, demo, characteristic]) => ({
            id, title, category, priceCents, condition, image, description, characteristic, status: "published", seller: "La CAV' — Sélection", demo: demo ?? false
          })),
          customers: []
        };
        data = JSON.stringify(defaultData);
        localStorage.setItem(localStorage_key, data);
      }
      
      const parsed = JSON.parse(data);
      const items = parsed[kind] || [];
      return publicOnly && kind === "products" ? items.filter(item => item.status === "published") : items;
    }
  };
  
  document.dispatchEvent(new Event("lacavDataReady"));
}
