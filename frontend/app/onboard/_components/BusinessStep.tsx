"use client"

import React, { useState } from "react";
import { api, ApiError, Business } from "@/lib/api";
import { Field, inputClass } from "./FormControls";
import { slugify } from "../_lib/slugify"

export function BusinessStep({ onDone }: {onDone: (b: Business) => void}) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [slug, setSlug] = useState("");
	const [slugTouched, setSlugTouched] = useState(false);
	const [payoutMethod, setPayoutMethod] = useState<"phone" | "shortcode">("phone");
	const [payoutPhone, setPayoutPhone] = useState("");
	const [shortcode, setShortCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const handleNameChange = (v: string) => {
		setName(v);
		if (!slugTouched) setSlug(slugify(v));
	};

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true)
		try {
			const business = await api.createBusiness({
				name,
				phone,
				slug,
				payout_method: payoutMethod,
				payout_phone: payoutMethod === "phone" ? payoutPhone: undefined,
				mpesa_shortcode: payoutMethod === "shortcode" ? shortcode : undefined,
			});
			onDone(business);
		} catch (e) {
			setError(e instanceof ApiError ? e.message : "something went. wrong. Try again")
		} finally {
			setLoading(false);
		}
	}
	return (
		<form onSubmit={submit}>
			<h1 className="text-2xl mb-1 text-white">Tell us about your business</h1>
			<p className="text-orange-400 text-sm mb-8">
				This becomes your public booking page.
			</p>
			<Field label="Business name">
				<input
					className={inputClass}
					value={name}
					onChange={(e) => handleNameChange(e.target.value)}
					placeholder="Martha Wangari"
					required
				/>
			</Field>

			<Field label="Contact phone">
				<input
					className={inputClass}
					value={phone}
					onChange={(e) => setPhone(e.target.value)}
					placeholder="2547XXXXXXXX"
					required
				/>
			</Field>

			<Field label="Booking link">
				<div className="flex items-center gap-1 text-sm">
					<span className="text-gray-500 shrink-0">
						yourapp.com/book/
					</span>
					<input
						className={inputClass}
						value={slug}
						onChange={(e) => {
							setSlugTouched(true);
							setSlug(slugify(e.target.value))
						}}
						required
					/>
				</div>
			</Field>

			<fieldset className="mb-5">
				<legend className="block text-sm text-gray-300 mb-1.5">
					Where Should Deposits go?
				</legend>
				<div className="flex gap-4 mb-3">
					<label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
						<input 
							type="radio"
							checked = {payoutMethod === "phone"}
							onChange={() => setPayoutMethod("phone")}
						/>
							My Mpesa Number
					</label>
					<label className="flex items-center gap-2 text-sm cursor-pointer text-gray-300">
						<input
							type="radio"
							checked={payoutMethod === "shortcode"}
							onChange={() => setPayoutMethod("shortcode")}
						/>
						I have a paybill/till
					</label>
				</div>
				{payoutMethod === "phone" ? (
					<input 
						className={inputClass}
						value={payoutPhone}
						onChange={(e) => setPayoutPhone(e.target.value)}
						placeholder="254XXXXXXXXX"
						required
					/>
				) : (
					<input
						className={inputClass}
						value={shortcode}
						onChange={(e) => setShortCode(e.target.value)}
						placeholder="Paybill or Till Number code"
						required
					/>
				)}
			</fieldset>
			{error && <p className="text-red-500 text-sm mb-4">{error}</p>}
			<button
				type="submit"
				disabled={loading}
				className="bg-orange-500 text-black font-medium px-5 py-2.5 rounded-sm hover:bg-orange-600 transition disabled:opacity-50"
			>
				{loading ? "Saving" : "Continue"}
			</button>
		</form>
	);
}

