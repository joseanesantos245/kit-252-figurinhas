import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Search, ShoppingCart, Heart, MapPin, ChevronRight, Truck, ShieldCheck, Trophy, Star, Sparkles, ThumbsUp, MoreVertical, Flag, Share2, Play, RotateCcw, BadgeCheck, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiMercadopago } from "react-icons/si";
import { img } from "@/lib/img";

// ── Link de compartilhamento — edite aqui para mudar facilmente ──
const SHARE_URL = "https://kit-252-figurinhas-mercadolivre.netlify.app/";
const SHARE_TITLE = "Kit 252 Figurinhas Copa Do Mundo 2026 - 36 Envelopes por R$ 159,90!";
// ────────────────────────────────────────────────────────────────

type SlideItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

export default function ProductPage() {
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedReview, setSelectedReview] = useState<{
    src: string; stars: number;
    name: string; initials: string; avatarColor: string; review: string;
  } | null>(null);
  const [helpful, setHelpful] = useState(false);
  const [showMoreReviews, setShowMoreReviews] = useState(false);
  const [helpfulExtra, setHelpfulExtra] = useState<Record<number, boolean>>({});
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [qty, setQty] = useState(1);
  const [showQtyPicker, setShowQtyPicker] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, url: SHARE_URL });
      } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(SHARE_URL); } catch { /* ignored */ }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  }

  // Saved address (shared with cep-page via localStorage)
  const [savedAddress, setSavedAddress] = useState<{ cep: string; logradouro: string; bairro: string; localidade: string; uf: string; numero: string } | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrCepInput, setAddrCepInput] = useState("");
  const [addrNumInput, setAddrNumInput] = useState("");
  const [addrCompInput, setAddrCompInput] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrBairro, setAddrBairro] = useState("");
  const [addrCidade, setAddrCidade] = useState("");
  const [addrUf, setAddrUf] = useState("");
  const [addrCepLoading, setAddrCepLoading] = useState(false);
  const [addrCepError, setAddrCepError] = useState("");
  const [addrCepData, setAddrCepData] = useState<object | null>(null);
  const [addrLocating, setAddrLocating] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("topmix_address");
    if (raw) { try { setSavedAddress(JSON.parse(raw)); } catch { /* ignored */ } }
  }, []);

  function formatCepAddr(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  async function fetchCepAddr(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setAddrCepLoading(true);
    setAddrCepError("");
    setAddrCepData(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const json = await res.json();
      if (json.erro) {
        setAddrCepError("CEP não encontrado. Verifique e tente novamente.");
      } else {
        setAddrCepData(json);
        setAddrStreet(json.logradouro ?? "");
        setAddrBairro(json.bairro ?? "");
        setAddrCidade(json.localidade ?? "");
        setAddrUf(json.uf ?? "");
      }
    } catch {
      setAddrCepError("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setAddrCepLoading(false);
    }
  }

  async function handleUseLocationAddr() {
    if (!navigator.geolocation) { setAddrCepError("Geolocalização não suportada."); return; }
    setAddrLocating(true);
    setAddrCepError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "pt-BR" } }
          );
          const json = await res.json();
          const postcode = json.address?.postcode?.replace(/\D/g, "") ?? "";
          if (postcode.length === 8) {
            setAddrCepInput(`${postcode.slice(0, 5)}-${postcode.slice(5)}`);
            await fetchCepAddr(postcode);
          } else {
            setAddrCepError("Não foi possível obter o CEP. Digite manualmente.");
          }
        } catch {
          setAddrCepError("Erro ao obter localização. Tente novamente.");
        } finally {
          setAddrLocating(false);
        }
      },
      () => { setAddrCepError("Permissão negada. Digite o CEP manualmente."); setAddrLocating(false); }
    );
  }

  function handleConfirmAddressModal() {
    if (!addrCepData) return;
    const addr = { cep: addrCepInput, logradouro: addrStreet, bairro: addrBairro, localidade: addrCidade, uf: addrUf, numero: addrNumInput };
    setSavedAddress(addr);
    localStorage.setItem("topmix_address", JSON.stringify(addr));
    setShowAddressModal(false);
    setAddrCepInput(""); setAddrNumInput(""); setAddrCompInput("");
    setAddrStreet(""); setAddrBairro(""); setAddrCidade(""); setAddrUf("");
    setAddrCepData(null); setAddrCepError("");
  }

  function handleBuyNow() {
    setCartCount(qty);
    setShowCart(true);
  }

  function handleFinalizarCompra() {
    setShowCart(false);
    setPreparando(true);
    setTimeout(() => {
      setPreparando(false);
      navigate("/cep");
    }, 2000);
  }

  function addToCart() {
    setCartCount((n) => n + 1);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }

  const extraReviews = [
    {
      name: 'Marcos V.',
      initials: 'MV',
      avatarColor: '#1565C0',
      stars: 5,
      time: 'Há 2 semanas',
      photos: [img('/images/review-1.webp')],
      review: 'Meu gato quis participar da abertura! 😂🐱 36 pacotes na mesa e muita figurinha boa. Produto original Panini, chegou tudo certinho!',
      helpful: 47,
    },
    {
      name: 'Bianca S.',
      initials: 'BS',
      avatarColor: '#00897B',
      stars: 5,
      time: 'Há 1 semana',
      photos: [img('/images/review-2.webp')],
      review: 'Olha a qualidade dos pacotes! 🔥 Chegaram todos lacrados e originais. Cada um com 7 cromos, impressão perfeita. Vale muito a pena!',
      helpful: 38,
    },
    {
      name: 'Eduardo P.',
      initials: 'EP',
      avatarColor: '#6A1B9A',
      stars: 5,
      time: 'Há 3 dias',
      photos: [img('/images/review-3.webp')],
      review: 'Organizei todos os 36 pacotes antes de abrir — que quantidade incrível! 🏆 Produto 100% original, entrega super rápida. Recomendo!',
      helpful: 62,
    },
    {
      name: 'Natália F.',
      initials: 'NF',
      avatarColor: '#C62828',
      stars: 5,
      time: 'Há 4 dias',
      photos: [img('/images/review-4.webp')],
      review: 'Pacote original Panini com 7 cromos cada! 👌 Design lindo, qualidade impecável. Chegou bem embalado e no prazo. Já pedi mais um kit!',
      helpful: 29,
    },
    {
      name: 'Rodrigo C.',
      initials: 'RC',
      avatarColor: '#2E7D32',
      stars: 5,
      time: 'Há 5 dias',
      photos: [img('/images/review-5.webp')],
      review: 'Olha o tamanho da pilha de figurinhas! 🌟 Saiu o Martinelli do Brasil. Figurinhas com qualidade incrível, produto 100% original Panini.',
      helpful: 51,
    },
    {
      name: 'Amanda T.',
      initials: 'AT',
      avatarColor: '#E65100',
      stars: 5,
      time: 'Há 1 semana',
      photos: [img('/images/review-1.webp')],
      review: 'Presente perfeito pro meu irmão e olha ele até trouxe o gato pra comemorar! 😄 Chegou rápido, produto original, super recomendo.',
      helpful: 35,
    },
    {
      name: 'Leandro M.',
      initials: 'LM',
      avatarColor: '#4527A0',
      stars: 5,
      time: 'Há 2 semanas',
      photos: [img('/images/review-2.webp')],
      review: 'Pacotes chegaram impecáveis! 🎯 Todos lacrados de fábrica, nenhum dano. 252 figurinhas no total, vale cada centavo.',
      helpful: 44,
    },
    {
      name: 'Patrícia H.',
      initials: 'PH',
      avatarColor: '#AD1457',
      stars: 5,
      time: 'Há 3 semanas',
      photos: [img('/images/review-3.webp')],
      review: 'Espalhei tudo na cama antes de abrir! 😍 36 pacotes, que vista incrível. Produto original Panini, entrega perfeita e bem embalado.',
      helpful: 27,
    },
    {
      name: 'Gustavo B.',
      initials: 'GB',
      avatarColor: '#00695C',
      stars: 5,
      time: 'Há 4 dias',
      photos: [img('/images/review-4.webp')],
      review: 'Cada pacote com 7 cromos de qualidade top! ⭐ Figurinhas com cores vivas e impressão perfeita. Chegou em 2 dias, frete grátis. Nota 10!',
      helpful: 56,
    },
    {
      name: 'Simone L.',
      initials: 'SL',
      avatarColor: '#37474F',
      stars: 5,
      time: 'Há 1 semana',
      photos: [img('/images/review-5.webp')],
      review: 'Que pilhão de figurinhas! 🤩 Saíram várias seleções diferentes. Produto original, chegou dentro do prazo e bem protegido. Amei!',
      helpful: 39,
    },
    {
      name: 'André N.',
      initials: 'AN',
      avatarColor: '#F9A825',
      stars: 5,
      time: 'Há 6 dias',
      photos: [img('/images/review-1.webp')],
      review: 'O gato aproveitou a sessão de fotos! 😂😻 Kit chegou certinho com álbum + 36 pacotes lacrados. Muito satisfeito com a compra!',
      helpful: 71,
    },
    {
      name: 'Viviane K.',
      initials: 'VK',
      avatarColor: '#0277BD',
      stars: 5,
      time: 'Há 5 dias',
      photos: [img('/images/review-2.webp')],
      review: 'Pacotes super bem conservados e originais! 🙌 Abri na hora que chegou. Cada um tem 7 cromos bonitos. Entrega relâmpago, recomendo!',
      helpful: 33,
    },
    {
      name: 'Thiago S.',
      initials: 'TS',
      avatarColor: '#558B2F',
      stars: 5,
      time: 'Há 2 dias',
      photos: [img('/images/review-3.webp')],
      review: 'Montei uma coleção incrível! 💪 Todos os 36 pacotes lacrados e originais. Produto chegou na data certa, sem nenhum dano. 5 estrelas!',
      helpful: 48,
    },
    {
      name: 'Rebeca O.',
      initials: 'RO',
      avatarColor: '#4E342E',
      stars: 5,
      time: 'Há 3 dias',
      photos: [img('/images/review-4.webp')],
      review: 'Dei de presente e a pessoa amou! 🎁 Pacote Panini original com 7 cromos de qualidade. Entrega rápida e embalagem protegida. Top demais!',
      helpful: 25,
    },
    {
      name: 'Fábio G.',
      initials: 'FG',
      avatarColor: '#1B5E20',
      stars: 5,
      time: 'Há 1 semana',
      photos: [img('/images/review-5.webp')],
      review: 'Tantas figurinhas! 🔝 Saíram jogadores raros nesse kit. Produto original Panini, qualidade impecável. Já completei várias seleções. Valeu!',
      helpful: 67,
    },
    {
      name: 'Daniela M.',
      initials: 'DM',
      avatarColor: '#880E4F',
      stars: 5,
      time: 'Há 4 dias',
      photos: [img('/images/review-1.webp')],
      review: 'Chegou tudo certinho! 😊 O gatinho aqui foi o primeiro a inspecionar os pacotes rs. Álbum + 252 figurinhas originais. Super recomendo!',
      helpful: 42,
    },
    {
      name: 'Cauã R.',
      initials: 'CR',
      avatarColor: '#1A237E',
      stars: 5,
      time: 'Há 6 dias',
      photos: [img('/images/review-2.webp')],
      review: 'Foto dos pacotes antes de abrir — que beleza! ✨ Produto 100% original Panini. Frete grátis e entrega super pontual. Nota máxima!',
      helpful: 30,
    },
    {
      name: 'Letícia B.',
      initials: 'LB',
      avatarColor: '#4A148C',
      stars: 5,
      time: 'Há 2 semanas',
      photos: [img('/images/review-3.webp')],
      review: 'Olha quantos pacotes! 😍🏅 Organizei na cama antes de abrir cada um. Figurinhas originais Panini, qualidade perfeita. Compra certíssima!',
      helpful: 58,
    },
  ];

  function handlePlayVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.volume = 1;
    v.muted = false;
    v.play();
    setVideoPlaying(true);
  }

  const slides: SlideItem[] = [
    { type: "image", src: img("/images/slide-1.webp") },
    { type: "video", src: img("/images/slide-2.mp4") },
    { type: "image", src: img("/images/slide-3.webp") },
    { type: "image", src: img("/images/slide-4.webp") },
    { type: "image", src: img("/images/slide-5.webp") },
    { type: "image", src: img("/images/slide-6.webp") },
    { type: "image", src: img("/images/slide-7.webp") },
  ];

  return (
    <div className="min-h-screen bg-ml-bg mx-auto max-w-[480px] shadow-xl relative pb-[80px]">
      {/* Header */}
      <header className="bg-ml-yellow px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft className="w-6 h-6 text-black" />
        </div>
        <div className="flex items-center gap-4">
          <Heart className={`w-6 h-6 transition-all ${favorited ? "fill-black text-black" : "text-black fill-none"}`} />
          <Search className="w-6 h-6 text-black" />
          <button className="relative" onClick={() => setShowCart(true)}>
            <ShoppingCart className="w-6 h-6 text-black" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      {/* Address Bar */}
      <div
        className="bg-ml-yellow px-4 py-2 flex items-center gap-2 text-xs border-t border-black/5 cursor-pointer active:bg-yellow-300 transition-colors"
        onClick={() => setShowAddressModal(true)}
      >
        <MapPin className="w-4 h-4 text-black/60 shrink-0" />
        <span className="text-black/80 truncate">
          {savedAddress
            ? `Enviar para: ${savedAddress.logradouro}${savedAddress.numero ? `, ${savedAddress.numero}` : ""} - ${savedAddress.localidade}`
            : "Enviar para meu endereço"}
        </span>
        <ChevronRight className="w-4 h-4 text-black/60 ml-auto shrink-0" />
      </div>
      <div className="bg-white">
        <div className="text-sm text-muted-foreground px-4 py-3">
          Novo | +3 mil vendidos
        </div>

        <div className="px-4 pb-2 flex items-center gap-0 w-fit">
          <span className="bg-orange-500 text-white text-[10px] font-semibold px-2 py-[3px] rounded-l-sm">
            MAIS VENDIDO
          </span>
          <span className="bg-white border border-orange-500 text-ml-blue text-[10px] font-semibold px-2 py-[3px] rounded-r-sm border-t-[#ffffff] border-r-[#ffffff] border-b-[#ffffff] border-l-[#ffffff]">
            1º em Kits de Figurinhas
          </span>
        </div>

        <h1 className="text-lg font-medium px-4 leading-snug">
          Kit 252 Figurinhas Copa Do Mundo 2026 - 36 Envelopes Panini
        </h1>

        <div className="px-4 py-2 flex items-center gap-1">
          <span className="text-sm font-medium text-ml-blue">4.9</span>
          <div className="flex text-ml-blue ml-1">
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
            <Star className="w-4 h-4 fill-current" />
          </div>
          <span className="text-sm text-muted-foreground ml-1">(1847)</span>
        </div>

        {/* Carousel */}
        <div className="bg-white">
          {/* Top bar: counter + heart — outside the image */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-gray-500">
              <span className="font-medium">{currentSlide + 1}</span>
              {" / "}
              <span>{slides.length}</span>
            </span>
            <button className="p-1" onClick={() => setFavorited(f => !f)}>
              <Heart className={`w-[22px] h-5 stroke-[1.5] transition-all ${favorited ? "fill-black text-black" : "text-gray-400 fill-none"}`} />
            </button>
          </div>

          {/* Image-only area */}
          <div className="w-full aspect-square bg-white overflow-hidden">
            <div
              className="flex w-full h-full overflow-x-scroll"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              } as React.CSSProperties}
              onScroll={(e) => {
                const index = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
                setCurrentSlide(index);
              }}
            >
              {slides.map((slide, i) =>
                slide.type === "video" ? (
                  <div
                    key={i}
                    className="relative w-full h-full shrink-0 flex items-center justify-center bg-black"
                    style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
                  >
                    <video
                      ref={videoRef}
                      src={slide.src}
                      className="w-full h-full object-contain"
                      playsInline
                      onEnded={() => setVideoPlaying(false)}
                    />
                    {!videoPlaying && (
                      <button
                        onClick={handlePlayVideo}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="w-7 h-7 text-gray-800 fill-gray-800 ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <img
                    key={i}
                    src={slide.src}
                    alt="Product"
                    className="w-full h-full object-contain shrink-0 p-4"
                    style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
                  />
                )
              )}
            </div>
          </div>

          {/* Bottom bar: dots + share — outside the image */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="w-8" />
            <div className="flex gap-2 items-center">
              {slides.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? 'bg-ml-blue' : 'bg-gray-300'}`} />
              ))}
            </div>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <Share2 className={`w-4 h-4 stroke-[1.5] transition-colors ${shareCopied ? "text-[#3483FA]" : "text-gray-500"}`} />
            </button>
          </div>
        </div>

        {/* Price & Buying options */}
        <div className="px-4 pb-6">
          <div className="text-sm text-gray-400 line-through">R$ 399,90</div>
          <div className="text-4xl font-normal text-foreground">R$ 159<span className="text-xl align-top">,90</span></div>
          <div className="mt-1 text-[15px]">
            em <span className="text-ml-green font-medium">5x R$ 31,98 sem juros</span> no cartão
          </div>

          <div className="mt-4 flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.386 14.765-5.373 20.136 0l76.989 76.989c14.192 14.192 33.064 22 53.12 22h15.138l-97.2 97.2c-30.418 30.417-79.73 30.417-110.148 0l-97.49-97.497h10.642z" fill="#32BCAD"/>
              <path d="M112.57 120.81c20.056 0 38.928 7.808 53.12 22l76.693 76.692c5.565 5.566 14.57 5.566 20.136 0l76.989-76.989c14.192-14.192 33.064-22 53.12-22h10.642l-97.49-97.49c-30.418-30.417-79.73-30.417-110.148 0l-97.2 97.2 14.138-.413z" fill="#32BCAD"/>
              <path d="M458.783 200.643l-54.36-54.36h-11.795c-14.14 0-27.68 5.62-37.667 15.606l-76.989 76.989c-13.693 13.693-37.438 13.706-51.144 0l-76.693-76.692c-9.987-9.987-23.527-15.607-37.667-15.607H97.327l-54.11 54.11c-30.418 30.417-30.418 79.73 0 110.147l54.11 54.111h15.141c14.14 0 27.68-5.62 37.667-15.607l76.693-76.692c6.924-6.924 15.983-10.387 25.572-10.387 9.588 0 18.648 3.463 25.572 10.387l76.989 76.989c9.987 9.987 23.527 15.607 37.667 15.607h11.795l54.36-54.361c30.417-30.417 30.417-79.73 0-110.24z" fill="#32BCAD"/>
            </svg>
            <div className="text-sm">
              <span className="text-ml-blue cursor-pointer">Pague no Pix</span> e ganhe 10% de desconto
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2">
            <Truck className="w-5 h-5 text-ml-green mt-0.5" />
            <div className="text-sm">
              <div className="text-ml-green font-medium">Frete grátis <span className="font-bold italic">FULL</span></div>
              <div className="text-muted-foreground">Chegará amanhã</div>
            </div>
          </div>

          {/* Estoque disponível */}
          <div className="mt-6">
            <p className="text-base font-semibold text-foreground mb-2">Estoque disponível</p>
            <button
              onClick={() => setShowQtyPicker(true)}
              className="w-full flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-base font-medium text-foreground">Quantidade: {qty}</span>
                <span className="text-sm text-gray-400">(+50 disponíveis)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <Button onClick={handleBuyNow} className="w-full bg-ml-blue hover:bg-ml-blue/90 text-white h-12 rounded-xl text-base font-medium">
              Comprar agora
            </Button>
            <Button
              onClick={addToCart}
              className="w-full bg-blue-50 hover:bg-blue-100 text-ml-blue h-12 rounded-xl text-base font-medium border-0 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao carrinho
            </Button>
          </div>

          {/* Seller */}
          <div className="mt-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden border border-gray-200">
              <img src={img("/images/seller-logo.webp")} alt="TopMix Brasil" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Loja oficial</span>
                <span className="font-semibold text-foreground">TopMix Brasil</span>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="10" fill="#3483FA"/>
                  <path d="M5.5 10.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-sm font-medium text-foreground mt-0.5">+500 mil vendas</div>
            </div>
          </div>

          {/* Guarantees */}
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <RotateCcw className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <span><span className="text-ml-blue font-medium">Devolução grátis</span> Você tem 30 dias a partir da data de recebimento.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <span><span className="text-ml-blue font-medium">Compra Garantida.</span> Receba o produto que está esperando ou devolvemos o dinheiro.</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-2 bg-ml-bg" />
      {/* Specs */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-medium mb-4">Características principais</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {[
            ['Título do livro', 'Álbum Copa do Mundo 2026 Oficial Panini'],
            ['Inclui', '1 Álbum capa mole + 35 envelopes (250 figurinhas)'],
            ['Páginas', '112'],
            ['Figurinhas no álbum', '980'],
            ['Seleções', '48'],
            ['Figurinhas especiais', '68 metálicas'],
            ['Idioma', 'Português'],
            ['Ano de publicação', '2026'],
            ['Marca', 'Panini']
          ].map(([k, v], i) => (
            <div key={k} className={`flex ${i % 2 === 0 ? 'bg-gray-200' : 'bg-white'}`}>
              <div className="w-1/3 p-3 text-sm font-medium border-r border-gray-200">{k}</div>
              <div className="w-2/3 p-3 text-sm">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-2 bg-ml-bg" />
      {/* Description */}
      <div className="bg-white p-4 pb-8">
        <h2 className="text-lg font-medium mb-4">Descrição</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Álbum Oficial Panini FIFA World Cup 2026™ é a edição completa para você colecionar todas as 980 figurinhas do Mundial de 2026. Inclui 1 álbum capa mole de 112 páginas + 35 envelopes com 250 figurinhas originais Panini — 7 cromos por envelope. Reúne as 48 seleções participantes, 68 figurinhas especiais metálicas e o escudo holográfico do torneio.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-3">
          Produto 100% oficial e original Panini, licenciado pela FIFA. Garantia de 90 dias após o recebimento.
        </p>
      </div>
      {/* Detalhes do produto */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-medium mb-4">Detalhes do produto</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            'É oficial e original: Sim, 100% Original e Oficial Panini/FIFA',
            'Produto: 1 Álbum capa mole + 35 envelopes (250 figurinhas)',
            'Total de figurinhas no álbum: 980',
            'Figurinhas especiais metálicas: 68',
            'Idade mínima recomendada: 6 anos',
            'ISBN: 7897653549146.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <button className="mt-4 text-ml-blue text-sm font-medium flex items-center gap-1">
          Ver mais detalhes <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Anúncio: <span className="font-medium">4892145760</span></span>
          <button className="text-ml-blue font-medium flex items-center gap-1">
            <Flag className="w-3.5 h-3.5" /> Denunciar
          </button>
        </div>
      </div>
      <div className="h-2 bg-ml-bg" />
      {/* Perguntas e respostas */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-medium mb-4">Perguntas e respostas</h2>
        <Button className="w-full bg-ml-blue hover:bg-ml-blue/90 text-white h-12 rounded-lg text-base font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5" />
          Perguntar
        </Button>
        <button className="mt-4 text-ml-blue text-sm font-medium flex items-center gap-1">
          Ver mais perguntas e respostas <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="h-2 bg-ml-bg" />
      {/* Opiniões */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-medium mb-4">Opiniões do produto</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl font-medium text-ml-blue">4.9</div>
          <div>
            <div className="flex text-yellow-400 mb-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <div className="text-sm text-gray-500">1.847 avaliações</div>
          </div>
        </div>

        {/* Rating bars */}
        {[
          { stars: 5, pct: 92 },
          { stars: 4, pct: 5 },
          { stars: 3, pct: 2 },
          { stars: 2, pct: 1 },
          { stars: 1, pct: 0 },
        ].map(({ stars, pct }) => (
          <div key={stars} className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 w-4">{stars}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current shrink-0" />
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-ml-blue" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500 w-6 text-right">{pct}%</span>
          </div>
        ))}

        <div className="mt-6">
          <h3 className="font-medium text-base mb-3">Opiniões com fotos</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { src: img('/images/rev-extra-1.webp'), stars: 5, name: 'Natália F.', initials: 'NF', avatarColor: '#3483FA', review: 'Pacote original Panini com 7 cromos cada! 👌 Design lindo, qualidade impecável. Chegou bem embalado e no prazo. Já pedi mais um kit!' },
              { src: img('/images/rev-extra-2.webp'), stars: 5, name: 'Rodrigo C.', initials: 'RC', avatarColor: '#2E7D32', review: 'Olha o tamanho da pilha de figurinhas! 🌟 Saiu o Martinelli do Brasil. Figurinhas com qualidade incrível, produto 100% original Panini.' },
              { src: img('/images/rev-extra-3.webp'), stars: 5, name: 'Sérgio M.', initials: 'SM', avatarColor: '#e53935', review: 'Saíram 3 figurinhas holográficas de escudos! ✨ Scotland, Jordan e Paraguai brilhando. Raridades que eu não esperava num único pacote!' },
              { src: img('/images/rev-extra-4.webp'), stars: 5, name: 'Bruna A.', initials: 'BA', avatarColor: '#7b1fa2', review: 'Coleção de escudos holográficos completa! 🏆 Suíça, Canadá, Holanda, Inglaterra e mais. Figurinhas lindas, produto 100% original Panini.' },
              { src: img('/images/rev-extra-5.webp'), stars: 5, name: 'Lúcio H.', initials: 'LH', avatarColor: '#f57c00', review: 'Pacote original Panini FIFA World Cup 2026! 🔥 7 cromos por pacote, lacrado de fábrica. Produto excelente, entrega super rápida. Recomendo!' },
              { src: img('/images/rev-extra-6.webp'), stars: 5, name: 'Marisa V.', initials: 'MV', avatarColor: '#00838F', review: 'Olha a quantidade de pacotes na mão! 😍 36 pacotes, 252 figurinhas no total. Produto 100% original, chegou tudo certinho e lacrado.' },
              { src: img('/images/rev-extra-7.webp'), stars: 5, name: 'Felipe C.', initials: 'FC', avatarColor: '#558B2F', review: 'Organizei tudo por seleção! 🗂️ Veio com figurinha especial prata e pacotes extras. Produto original Panini Copa 2026. Entrega impecável!' },
            ].map((op, i) => (
              <button
                key={i}
                className="shrink-0 relative rounded-lg overflow-hidden w-28 h-40 cursor-pointer"
                onClick={() => setSelectedReview(op)}
              >
                <img src={op.src} alt={`Opinião ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/50 rounded px-1 py-0.5">
                  <span className="text-white text-xs font-medium">{op.stars}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Review item */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex text-yellow-400">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Há 3 semanas</span>
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-1">Chegou tudo certo! O produto é exatamente como descrito, muito satisfeito com a compra.</p>
          <button
            onClick={() => setHelpful(!helpful)}
            className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors ${helpful ? 'bg-ml-blue border-ml-blue text-white' : 'border-gray-300 text-gray-600'}`}
          >
            <ThumbsUp className={`w-4 h-4 ${helpful ? 'text-white fill-white' : ''}`} />
            Útil <span className="font-medium">{helpful ? 46 : 45}</span>
          </button>
        </div>

        <button
          onClick={() => setShowMoreReviews(true)}
          className="mt-4 text-ml-blue text-sm font-medium flex items-center gap-1"
        >
          Ver mais opiniões <ChevronRight className="w-4 h-4" />
        </button>
      </div>
     <div className="h-2 bg-ml-bg" />

{/* Você também pode gostar */}
<div className="bg-white p-4 pb-6">
  <h2 className="text-lg font-medium mb-4">Você também pode gostar</h2>

  <div className="flex gap-3 overflow-x-auto pb-2">
    {[
      {
        name: 'Kit 140 Figurinhas Copa Do Mundo 2026 - 20 Envelopes Panini',
        price: 'R$ 89,90',
        img: img('/images/slide-1.webp'),
        link: 'https://kit-140-figurinhas-mercadolivre.netlify.app/',
      },
      {
        name: 'Kit 70 Figurinhas Copa Do Mundo 2026 - 10 Envelopes Panini',
        price: 'R$ 49,90',
        img: img('/images/slide-3.webp'),
        link: 'https://kit-70-figurinhas-mercadolivre.netlify.app/',
      },
      {
        name: 'Kit Álbum Copa Do Mundo 2026 Capa Mole + 250 Figurinhas',
        price: 'R$ 49,00',
        img: img('/images/review-1.webp'),
        link: 'https://album-mais-250figurinhas-mercadolivre.netlify.app/',
      },
    ].map((prod) => (
      <a
        key={prod.name}
        href={prod.link}
        className="shrink-0 w-40 border border-gray-100 rounded-xl overflow-hidden shadow-sm"
      >
        <div className="w-full h-36 bg-gray-50 flex items-center justify-center overflow-hidden">
          <img src={prod.img} alt={prod.name} className="w-full h-full object-cover" />
        </div>

        <div className="p-2">
          <p className="text-xs text-gray-700 leading-snug line-clamp-2 mb-2">{prod.name}</p>
          <p className="text-sm font-semibold text-gray-900">{prod.price}</p>
          <span className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
            FULL &nbsp;·&nbsp; 10% Off Pix
          </span>
        </div>
      </a>
    ))}
  </div>
</div>

<div className="h-2 bg-ml-bg" />
      {/* Review Photo Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="relative mx-4 max-w-[360px] w-full rounded-2xl overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={selectedReview.src} alt="Opinião" className="w-full object-contain max-h-[55vh]" />
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setSelectedReview(null)}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="bg-white px-4 pt-4 pb-5">
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-xs text-gray-400 ml-1">Avaliação verificada</span>
              </div>
              {/* Review text */}
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{selectedReview.review}</p>
              {/* Person */}
              <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                  style={{ backgroundColor: selectedReview.avatarColor }}
                >
                  {selectedReview.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedReview.name}</p>
                  <p className="text-xs text-gray-400">Comprador verificado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More Reviews Modal */}
      {showMoreReviews && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col max-w-[480px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
            <button onClick={() => setShowMoreReviews(false)} className="p-1">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-base font-semibold text-foreground">Opiniões do produto</h2>
          </div>
          {/* Scrollable reviews list */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {extraReviews.map((r, i) => (
              <div key={i} className="pt-5 pb-4 border-b border-gray-100 last:border-0">
                {/* Stars + time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex text-yellow-400">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.stars ? 'fill-current' : 'text-gray-200 fill-current'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{r.time}</span>
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                {/* Photos */}
                {r.photos.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {r.photos.map((photo, pi) => (
                      <button
                        key={pi}
                        onClick={() => setLightboxSrc(photo)}
                        className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-50 focus:outline-none"
                      >
                        <img src={photo} alt={`Foto avaliação ${pi + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {/* Review text */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.review}</p>
                {/* Reviewer + útil */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: r.avatarColor }}
                    >
                      {r.initials}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{r.name}</p>
                      <p className="text-[10px] text-gray-400">Comprador verificado</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHelpfulExtra(prev => ({ ...prev, [i]: !prev[i] }))}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${helpfulExtra[i] ? 'bg-ml-blue border-ml-blue text-white' : 'border-gray-300 text-gray-600'}`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${helpfulExtra[i] ? 'fill-white text-white' : ''}`} />
                    Útil <span>{helpfulExtra[i] ? r.helpful + 1 : r.helpful}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center max-w-[480px] mx-auto"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setLightboxSrc(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img
            src={lightboxSrc}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Quantity Picker */}
      {showQtyPicker && (
        <div className="fixed inset-0 z-[260] flex items-end max-w-[480px] mx-auto" onClick={() => setShowQtyPicker(false)}>
          <div className="w-full bg-white rounded-t-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Selecione a quantidade</h2>
              <button onClick={() => setShowQtyPicker(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-72 py-2">
              {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => { setQty(n); setShowQtyPicker(false); }}
                  className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors ${qty === n ? "bg-blue-50 text-ml-blue font-semibold" : "text-gray-800 hover:bg-gray-50"}`}
                >
                  <span>{n} {n === 1 ? "unidade" : "unidades"}</span>
                  {qty === n && <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-ml-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preparando sua compra */}
      {preparando && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center max-w-[480px] mx-auto">
          <div className="flex flex-col items-center gap-8 px-10 text-center">
            <p className="text-[22px] font-semibold text-gray-900 leading-snug">
              Preparando tudo para<br />sua compra
            </p>
            <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-[#3483FA] animate-spin" />
          </div>
        </div>
      )}

      {/* Cart added toast */}
      {cartAdded && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <ShoppingCart className="w-3.5 h-3.5" />
          Adicionado ao carrinho!
        </div>
      )}

      {/* Share copied toast */}
      {shareCopied && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <Share2 className="w-3.5 h-3.5" />
          Link copiado!
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4 z-50 mx-auto max-w-[480px]">
        <div className="flex flex-col shrink-0">
          <div className="flex items-start gap-0.5 leading-none">
            <span className="text-xs font-medium text-gray-700 mt-1">R$</span>
            <span className="text-3xl font-semibold text-gray-900 leading-none">159</span>
            <span className="text-xs font-semibold text-gray-900 leading-none mt-0.5">,90</span>
          </div>
          <span className="text-[11px] text-ml-green font-medium leading-tight mt-0.5">5x R$ 31,98 sem juros</span>
        </div>
        <Button onClick={handleBuyNow} className="flex-1 bg-ml-blue hover:bg-ml-blue/90 text-white rounded-xl h-12 font-semibold text-base">
          Comprar agora
        </Button>
      </div>

      {/* Cart — slide in from right */}
      <div
        className="fixed inset-0 z-[250] max-w-[480px] mx-auto transition-all duration-300"
        style={{
          pointerEvents: showCart ? "auto" : "none",
          backgroundColor: showCart ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        }}
        onClick={() => setShowCart(false)}
      >
        <div
          className="absolute inset-y-0 right-0 w-[92%] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out"
          style={{ transform: showCart ? "translateX(0)" : "translateX(100%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-ml-yellow">
            <button onClick={() => setShowCart(false)} className="-ml-1 p-1">
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h2 className="text-base font-semibold text-black flex-1">Meu carrinho</h2>
            {cartCount > 0 && (
              <span className="text-xs text-black/70 font-medium">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {cartCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 pb-20">
                <ShoppingCart className="w-14 h-14 text-gray-200" />
                <p className="text-sm text-gray-400">Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                {/* Product row */}
                <div className="flex items-start gap-3 px-4 py-5 border-b border-gray-100 bg-white">
                  <img
                    src={img("/images/slide-1.webp")}
                    alt="produto"
                    className="w-20 h-20 rounded-xl object-contain border border-gray-100 shrink-0 bg-gray-50 p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug mb-2">
                      Kit 252 Figurinhas Copa Do Mundo 2026 - 36 Envelopes Panini
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-base font-bold text-gray-900">R$ 159,90</span>
                      <span className="text-[10px] text-gray-400 line-through">R$ 399,90</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCartCount((n) => Math.max(1, n - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 text-xl font-medium leading-none"
                      >−</button>
                      <span className="text-sm font-bold w-6 text-center">{cartCount}</span>
                      <button
                        onClick={() => setCartCount((n) => n + 1)}
                        className="w-8 h-8 rounded-full border border-ml-blue bg-ml-blue text-white flex items-center justify-center text-xl font-medium leading-none"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="px-4 py-4 space-y-2 bg-white mt-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                    <span>R$ {(159.90 * cartCount).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Frete</span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span>R$ {(159.90 * cartCount).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-xs text-green-600">
                    Em 5x de R$ {(159.90 * cartCount / 5).toFixed(2).replace('.', ',')} sem juros
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer actions */}
          {cartCount > 0 && (
            <div className="px-4 py-4 border-t border-gray-100 flex flex-col gap-2 bg-white">
              <Button onClick={handleFinalizarCompra} className="w-full bg-ml-blue hover:bg-ml-blue/90 text-white rounded-xl font-semibold h-12 text-base">
                Finalizar compra
              </Button>
              <button
                onClick={() => setShowCart(false)}
                className="w-full text-ml-blue text-sm font-medium py-2"
              >
                Continuar comprando
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Address Modal ── */}
      {showAddressModal && (
        <div className="fixed inset-0 z-[500] bg-black/40 flex items-end max-w-[480px] mx-auto">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Informe seu endereço</h3>
              <button onClick={() => { setShowAddressModal(false); setAddrCepData(null); setAddrCepError(""); setAddrCepInput(""); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-4 py-4 flex flex-col gap-4">
              {/* Use location */}
              <button
                onClick={handleUseLocationAddr}
                className="flex items-center gap-3 py-3 border border-gray-200 rounded-xl px-4"
              >
                {addrLocating ? (
                  <div className="w-5 h-5 border-2 border-[#3483FA] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5 text-[#3483FA]" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-[#3483FA]">
                    {addrLocating ? "Obtendo localização..." : "Usar minha localização atual"}
                  </p>
                  <p className="text-xs text-gray-400">Detectamos seu CEP automaticamente</p>
                </div>
              </button>

              {/* CEP input */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">CEP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={addrCepInput}
                  onChange={(e) => setAddrCepInput(formatCepAddr(e.target.value))}
                  onBlur={() => { if (addrCepInput.replace(/\D/g, "").length === 8) fetchCepAddr(addrCepInput); }}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA] transition-colors"
                />
                {addrCepLoading && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
                {addrCepError && <p className="text-xs text-red-500 mt-1">{addrCepError}</p>}
              </div>

              {addrCepData && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Rua</label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="Nome da rua"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA] transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Número</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 100"
                        value={addrNumInput}
                        onChange={(e) => setAddrNumInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Complemento</label>
                      <input
                        type="text"
                        placeholder="Apto, bloco..."
                        value={addrCompInput}
                        onChange={(e) => setAddrCompInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Bairro</label>
                    <input
                      type="text"
                      value={addrBairro}
                      onChange={(e) => setAddrBairro(e.target.value)}
                      placeholder="Nome do bairro"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA] transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Cidade</label>
                      <input
                        type="text"
                        value={addrCidade}
                        onChange={(e) => setAddrCidade(e.target.value)}
                        placeholder="Nome da cidade"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA] transition-colors"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">UF</label>
                      <input
                        type="text"
                        value={addrUf}
                        onChange={(e) => setAddrUf(e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3483FA] transition-colors uppercase"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  if (!addrCepData) { fetchCepAddr(addrCepInput); return; }
                  if (!addrNumInput) { return; }
                  handleConfirmAddressModal();
                }}
                disabled={addrCepInput.replace(/\D/g, "").length < 8}
                className={`w-full h-12 rounded-xl font-semibold text-base transition-colors ${addrCepInput.replace(/\D/g, "").length === 8 ? "bg-[#3483FA] text-white hover:bg-[#2968c8]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                Confirmar endereço
              </button>

              <p className="text-xs text-center text-gray-400 pb-2">
                Não sabe seu CEP?{" "}
                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-[#3483FA] font-medium">
                  Consulte os Correios
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
