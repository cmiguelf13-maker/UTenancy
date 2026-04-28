'use client'

import Image from 'next/image'
import type { SampleListing } from '@/lib/sampleListings'

export default function SampleListingCard({ listing }: { listing: SampleListing }) {
  return (
    <article className="relative group bg-white rounded-3xl overflow-hidden border border-out-var select-none">
      {/* "Sample" hover overlay */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-3xl"
        style={{ background: 'rgba(46,30,24,0.35)', backdropFilter: 'blur(2px)' }}
      >
        <span className="bg-white text-espresso font-head font-black text-2xl px-10 py-4 rounded-full shadow-xl uppercase tracking-[0.2em]">
          Sample
        </span>
      </div>

      <div className="block cursor-default">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={listing.img}
            alt="Sample listing"
            fill
            className="object-cover"
            sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw"
          />
          <span className={`${listing.type === 'open' ? 'badge-open' : 'badge-group'} absolute top-4 left-4 text-[11px] font-head font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg`}>
            {listing.type === 'open' ? 'Open Room' : 'Group Formation'}
          </span>
        </div>

        {/* Card body */}
        <div className="p-5">
          <h3 className="font-head font-bold text-clay-dark text-base truncate mb-1">{listing.title}</h3>
          <p className="text-xs font-body text-muted flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {listing.location}
          </p>

          {listing.university && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] font-head font-bold text-clay bg-clay/10 px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[10px]">school</span>
                Near {listing.university}
              </span>
            </div>
          )}

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-head font-bold uppercase tracking-widest text-muted mb-0.5">
                {listing.type === 'group' ? 'Total Rent' : 'Per Person'}
              </p>
              <p className="font-head font-black text-clay-dark text-lg">
                ${listing.price.toLocaleString()}
                <span className="text-xs font-normal text-muted">/mo</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-head font-bold text-clay">
                {listing.beds} bed{listing.beds !== 1 ? 's' : ''} avail.
              </p>
              {listing.baths != null && (
                <p className="text-xs text-muted font-body">
                  {listing.baths} bath{listing.baths !== 1 ? 's' : ''}
                </p>
              )}
              <p className="text-xs text-muted font-body flex items-center justify-end gap-1">
                <span className="material-symbols-outlined fill text-xs">group</span>
                {listing.interested} interested
              </p>
            </div>
          </div>

          {listing.distanceMi != null && listing.university ? (
            <div className="mt-4 pt-4 border-t border-out-var/60 flex items-center justify-between">
              <span className="font-head font-bold text-clay text-xs flex items-center gap-1">
                View Listing <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
              <span className="feature-pill text-[10px] px-2.5 py-1">
                {listing.distanceMi} mi · {listing.university}
              </span>
            </div>
          ) : listing.availableDate ? (
            <div className="mt-4 pt-4 border-t border-out-var/60 flex items-center justify-between">
              <span className="font-head font-bold text-clay text-xs flex items-center gap-1">
                View Listing <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
              <span className="feature-pill text-[10px] px-2.5 py-1">
                Avail. {new Date(listing.availableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
