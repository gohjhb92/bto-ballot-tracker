"use client";

import type { ApplicantType, EstateType, FlatType, ProfileSelection } from "@/lib/types";
import { ALL_FLAT_TYPES, ESTATE_TYPES_LEGACY, ESTATE_TYPES_SPP } from "@/lib/data";
import { APPLICANT_LABELS, ESTATE_LABELS } from "@/lib/utils";

interface Props {
  value: ProfileSelection;
  onChange: (v: ProfileSelection) => void;
}

const APPLICANT_TYPES: ApplicantType[] = ["firstTimer", "secondTimer", "singles"];

export default function ProfileSelector({ value, onChange }: Props) {
  function set(partial: Partial<ProfileSelection>) {
    const next = { ...value, ...partial };

    // Singles → lock to 2-room Flexi
    if (partial.applicantType === "singles") {
      next.flatType = "2-room Flexi";
    }
    // If switching away from singles but flatType is still locked, allow any
    if (partial.applicantType && partial.applicantType !== "singles" && value.applicantType === "singles") {
      next.flatType = "4-room";
    }

    onChange(next);
  }

  const legacyEstates = ESTATE_TYPES_LEGACY;
  const sppEstates = ESTATE_TYPES_SPP;

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        Your Profile
      </h2>

      {/* Applicant Type */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Applicant Type</label>
        <div className="flex flex-wrap gap-2">
          {APPLICANT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => set({ applicantType: t })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                value.applicantType === t
                  ? "bg-[#EF1826] text-white"
                  : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
              }`}
            >
              {APPLICANT_LABELS[t]}
            </button>
          ))}
        </div>
        {value.applicantType === "firstTimer" && (
          <p className="text-xs text-slate-500 mt-2">
            First-timers receive 2 ballot chances per exercise.
          </p>
        )}
      </div>

      {/* Flat Type */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Flat Type</label>
        <div className="flex flex-wrap gap-2">
          {ALL_FLAT_TYPES.map((ft) => {
            const locked = value.applicantType === "singles" && ft !== "2-room Flexi";
            return (
              <button
                key={ft}
                disabled={locked}
                onClick={() => set({ flatType: ft })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  value.flatType === ft
                    ? "bg-[#EF1826] text-white"
                    : locked
                    ? "bg-[#0b1120] border border-[#1e293b] text-slate-600 cursor-not-allowed"
                    : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
                }`}
              >
                {ft}
              </button>
            );
          })}
        </div>
        {value.applicantType === "singles" && (
          <p className="text-xs text-slate-500 mt-2">
            Singles (SC) may only ballot for 2-room Flexi flats.
          </p>
        )}
      </div>

      {/* Estate Type */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Estate Classification</label>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Legacy (pre-Oct 2024)</p>
            <div className="flex flex-wrap gap-2">
              {legacyEstates.map((et) => (
                <button
                  key={et}
                  onClick={() => set({ estateType: et as EstateType })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    value.estateType === et
                      ? "bg-[#EF1826] text-white"
                      : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {ESTATE_LABELS[et]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Standard / Plus / Prime (Oct 2024 onwards)</p>
            <div className="flex flex-wrap gap-2">
              {sppEstates.map((et) => (
                <button
                  key={et}
                  onClick={() => set({ estateType: et as EstateType })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    value.estateType === et
                      ? "bg-[#EF1826] text-white"
                      : "bg-[#0b1120] border border-[#334155] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {ESTATE_LABELS[et]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
