'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listings'

export default function ListingCard({ listing }: { listing: Listing }) {
  const [saved, setSaved] = useState(false)
  return (
    <article className={`card-lift img-zoom bg-white rounded-3xl overflow-hidden border cursor-pointer relative ${listing.featured ? 'border-clay/30 shadow-lg shadow-clay/10' : 'border-out-var/40'}`}>
      {listing.featured && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center">
          <span className="clay-grad text-white text-[10px] font-head font-bold uppercase tracking-widest px-4 py-1.5 rounded-b-full shadow-md">⭐ Featured Listing</span>
        </div>
      )}
      <Link href={`/listings/${listing.slug}`} className="block">
        <div className="relative h-52 overflow-hidden">
          {listing.img ? (
            listing.img.includes('supabase.co') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.img} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <Image src={listing.img} alt={listing.title} fill className="object-cover" sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 33vw" />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-linen to-surf-lo flex items-center justify-center">
              <span className="material-symbols-outlined text-out-var text-6xl">home</span>
            </div>
          )}
          <span className={`${listing.type === 'open' ? 'badge-open' : 'badge-group'} absolute top-4 left-4 text-[11px] font-head font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg`}>
            {listing.type === 'open' ? 'Open Room' : 'Group Formation'}
          </span>
          <button
            className="absolute top-4 right-4 w-9 h-9 bg-white/85 backdrop-blur-sm rounded-full flex items-center justify-center text-clay hover:bg-white transition-all shadow-md"
            onClick={(e) => { e.preventDefault(); setSaved((s) => !s) }}
            aria-label="Save to favourites"
          >
            <span className={`material-symbols-outlined text-lg ${saved ? 'fill' : ''}`}>favorite</span>
          </button>
        </div>
        <div className="p-5">
          <h3 className="font-head font-bold text-clay-dark text-base truncate mb-1">{listing.title}</h3>
          <p className="text-xs font-body text-muted flex items-center gap-1 mb-4">
            <span className="material-symbols-outlined text-xs">location_on</span>{listing.location}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] font-head font-bold uppercase tracking-widest text-muted mb-0.5">{listing.type === 'group' ? 'Total Rent' : 'Per Person'}</p>
              <p className="font-head font-black text-clay-dark text-lg">${listing.price.toLocaleString()}<span className="text-xs font-normal text-muted">/mo</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-head font-bold text-clay">{listing.beds} bed{listing.beds !== 1 ? 's' : ''} avail.</p>
              {listing.baths != null && (
                <p className="text-xs text-muted font-body">{listing.baths} bath{listing.baths !== 1 ? 's' : ''}</p>
              )}
              <p className="text-xs text-muted font-body flex items-center justify-end gap-1">
                <span className="material-symbols-outlined fill text-xs">group</span>{listing.interested} interested
              </p>
            </div>
          </div>
          {(listing.featured || listing.distanceMi) && (
            <div className="mt-4 pt-4 border-t border-out-var/30 flex items-center justify-between">
              <span className="font-head font-bold text-clay text-xs flex items-center gap-1">
                View Listing <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
              {listing.distanceMi != null && listing.university && (
                <span className="feature-pill text-[10px] px-2.5 py-1">~{listing.distanceMi} mi to {listing.university}</span>
              )}
            </div>
          )}
          {!listing.featured && !listing.distanceMi && listing.availableDate && (
            <div className="mt-4 pt-4 border-t border-out-var/30 flex items-center justify-between">
              <span className="font-head font-bold text-clay text-xs flex items-center gap-1">
                View Listing <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
              <span className="feature-pill text-[10px] px-2.5 py-1">
                Avail. {new Date(listing.availableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
