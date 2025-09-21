/// <reference types="google.maps" />
/**
 * useAddressAutocompleteMap
 * - Nạp Google Maps + Places động (1 lần)
 * - Gắn Autocomplete cho ô địa chỉ
 * - Khi chọn gợi ý: cập nhật địa chỉ, center map, đặt/di chuyển marker
 * - Geocode địa chỉ ban đầu (nếu có)
 * - Expose toạ độ (lat/lng) qua callback onLatLngChange và giữ address ở state
 *
 * Yêu cầu TypeScript:
 *   npm i -D @types/google.maps
 * Và thêm vào vite-env.d.ts (hoặc global .d.ts):
 *   /// <reference types="google.maps" />
 */
import * as React from "react";

declare global {
  interface Window {
    google?: any;
  }
}

type LatLngLiteral = { lat: number; lng: number };

export interface UseAddressMapOptions {
  /** Địa chỉ ban đầu (nếu có) để geocode khi mở form */
  initialAddress?: string;
  /** Callback khi địa chỉ thay đổi (từ Autocomplete hoặc gõ tay) */
  onAddressChange?: (address: string) => void;
  /** Callback khi toạ độ thay đổi; null nếu chưa xác định */
  onLatLngChange?: (coords: LatLngLiteral | null) => void;
  /** Tâm bản đồ mặc định khi chưa có địa chỉ */
  defaultCenter?: LatLngLiteral;
  /** Zoom mặc định khi chưa có địa chỉ */
  defaultZoom?: number;
  /** Zoom khi đã chọn địa chỉ */
  selectedZoom?: number;
  /** Ngôn ngữ Google Maps */
  language?: string;
  /** Truyền sẵn API key; nếu không hook sẽ đọc từ env (Vite/CRA) */
  apiKey?: string;
}

function getApiKeyFromEnv() {
  // Vite
  const fromVite = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY;
  // CRA
  const fromCRA =
    (typeof process !== "undefined" &&
      (process as any)?.env?.REACT_APP_GOOGLE_MAPS_API_KEY) ||
    undefined;
  return fromVite || fromCRA || "";
}

function loadGoogleMaps(apiKey: string, language = "vi"): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (!apiKey) return Promise.reject(new Error("Missing Google Maps API key"));

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-gmaps-loader="1"]'
    );
    const onLoaded = () => resolve();

    if (existing) {
      existing.addEventListener("load", onLoaded);
      existing.addEventListener("error", reject);
      if ((existing as any).dataset.loaded === "1") resolve();
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${language}`;
    s.async = true;
    s.defer = true;
    s.dataset.gmapsLoader = "1";
    s.addEventListener("load", () => {
      (s as any).dataset.loaded = "1";
      resolve();
    });
    s.addEventListener("error", reject);
    document.head.appendChild(s);
  });
}

export function useAddressAutocompleteMap(options: UseAddressMapOptions = {}) {
  const {
    initialAddress = "",
    onAddressChange,
    onLatLngChange,
    defaultCenter = { lat: 16.047079, lng: 108.20623 }, // Trung VN
    defaultZoom = 5,
    selectedZoom = 15,
    language = "vi",
    apiKey: apiKeyProp,
  } = options;

  const [address, setAddress] = React.useState<string>(initialAddress);
  const addressInputRef = React.useRef<HTMLInputElement>(null);
  const mapDivRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const markerRef = React.useRef<google.maps.Marker | null>(null);
  const coordsRef = React.useRef<LatLngLiteral | null>(null);

  // nạp Google Maps + Places và khởi tạo map + autocomplete
  React.useEffect(() => {
    const apiKey = apiKeyProp || getApiKeyFromEnv();

    loadGoogleMaps(apiKey, language)
      .then(() => {
        // Map
        if (mapDivRef.current && !mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapDivRef.current, {
            center: defaultCenter,
            zoom: defaultZoom,
          });
        }

        // Autocomplete (dùng biến cục bộ để tránh 'possibly null')
        let listener: google.maps.MapsEventListener | null = null;
        if (addressInputRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ["geocode"],
              fields: ["formatted_address", "geometry"],
            }
          );

          listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const loc = place?.geometry?.location;
            const addr =
              place?.formatted_address || addressInputRef.current!.value;

            setAddress(addr);
            onAddressChange?.(addr);

            if (loc && mapRef.current) {
              mapRef.current.setCenter(loc);
              mapRef.current.setZoom(selectedZoom);
              if (!markerRef.current) {
                markerRef.current = new window.google.maps.Marker({
                  map: mapRef.current,
                  position: loc,
                });
              } else {
                markerRef.current.setPosition(loc);
              }
              const c = { lat: loc.lat(), lng: loc.lng() };
              coordsRef.current = c;
              onLatLngChange?.(c);
            } else {
              coordsRef.current = null;
              onLatLngChange?.(null);
            }
          });
        }

        // Nếu có sẵn địa chỉ ban đầu -> geocode để set vị trí
        if (initialAddress) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { address: initialAddress },
            (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                const loc = results[0].geometry.location;
                if (mapRef.current) {
                  mapRef.current.setCenter(loc);
                  mapRef.current.setZoom(selectedZoom);
                  if (!markerRef.current) {
                    markerRef.current = new window.google.maps.Marker({
                      map: mapRef.current,
                      position: loc,
                    });
                  } else {
                    markerRef.current.setPosition(loc);
                  }
                  const c = { lat: loc.lat(), lng: loc.lng() };
                  coordsRef.current = c;
                  onLatLngChange?.(c);
                }
              }
            }
          );
        }

        return () => {
          if (listener) listener.remove();
        };
      })
      .catch((err) => {
        console.error("Google Maps load error", err);
      });

    // Re-geocode nếu initialAddress thay đổi từ bên ngoài
  }, [
    initialAddress,
    apiKeyProp,
    language,
    defaultCenter.lat,
    defaultCenter.lng,
    defaultZoom,
    selectedZoom,
    onAddressChange,
    onLatLngChange,
  ]);

  // Khi user gõ tay vào ô input
  const handleManualChange = (val: string) => {
    setAddress(val);
    onAddressChange?.(val);
    // khi gõ tay, chưa chắc có tọa độ (đợi select từ Autocomplete)
    onLatLngChange?.(coordsRef.current);
  };

  return {
    address,
    setAddress: handleManualChange,
    addressInputRef,
    mapDivRef,
    /** Expose một số thực thể phòng khi cần tuỳ biến thêm */
    map: mapRef,
    marker: markerRef,
  };
}
