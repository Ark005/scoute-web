"use client";

import { getTransport, aviasalesUrl, tutuUrl } from "@/lib/transport";

interface Props {
  slug: string;
  startLat?: number;
  startLng?: number;
}

export default function TransportBlock({ slug, startLat, startLng }: Props) {
  if (!startLat || !startLng) return null;

  const t = getTransport(slug, startLat, startLng);

  const carLabel = t.car_km < 200
    ? `${t.car_km} км · ~${t.car_hours} ч`
    : t.car_km < 1000
    ? `${t.car_km} км · ~${t.car_hours} ч`
    : `${t.car_km} км · ~${Math.floor(t.car_hours / 24)}–${Math.ceil(t.car_hours / 24)} дн`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mx-4 mb-3">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Как добраться из Москвы</h3>
      <div className="space-y-2">

        {/* Авто — всегда */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚗</span>
            <div>
              <div className="text-sm font-semibold text-gray-800">На машине</div>
              <div className="text-xs text-gray-400">{carLabel}</div>
            </div>
          </div>
          <a
            href={`https://yandex.ru/maps/?rtext=55.7558,37.6173~${startLat},${startLng}&rtt=auto`}
            target="_blank"
            rel="noopener"
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Маршрут →
          </a>
        </div>

        {/* Поезд */}
        {t.train_city && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚂</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">На поезде</div>
                <div className="text-xs text-gray-400">до {t.train_city}</div>
              </div>
            </div>
            <a
              href={tutuUrl(t.train_city)}
              target="_blank"
              rel="noopener"
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Билеты →
            </a>
          </div>
        )}

        {/* Самолёт */}
        {t.flight_iata && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✈️</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">На самолёте</div>
                <div className="text-xs text-gray-400">до {t.flight_city}</div>
              </div>
            </div>
            <a
              href={aviasalesUrl(t.flight_iata)}
              target="_blank"
              rel="noopener"
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Билеты →
            </a>
          </div>
        )}

        {/* Автобус для коротких */}
        {t.car_km < 300 && t.train_city && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚌</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">На автобусе</div>
                <div className="text-xs text-gray-400">до {t.train_city}</div>
              </div>
            </div>
            <a
              href={`https://www.tutu.ru/avtobusy/?st1=Москва&st2=${encodeURIComponent(t.train_city)}`}
              target="_blank"
              rel="noopener"
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Билеты →
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
