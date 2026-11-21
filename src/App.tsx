import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import shopCafe from "./assets/shop-cafe.png";
import shopFashion from "./assets/shop-fashion.png";
import shopSpace from "./assets/shop-space.png";

type Photo = {
  file: File;
  url: string;
};

type Currency = "NGN" | "USD";
type LegalDocument = "privacy" | "terms" | null;

const SPACE_IMAGES = [
  { src: shopSpace, alt: "A sunlit open corner in an independent homeware shop" },
  { src: shopFashion, alt: "An underused window area in an independent fashion boutique" },
  { src: shopCafe, alt: "A flexible open area in a modern independent café" },
];

const SPACE_RATES: Record<string, { min: number; max: number }> = {
  "Window display": { min: 18, max: 28 },
  "Retail floor space": { min: 24, max: 38 },
  "Counter or shelf": { min: 12, max: 20 },
  "Workshop or event area": { min: 30, max: 48 },
  Other: { min: 16, max: 26 },
};

const Icon = ({
  name,
  className = "size-5",
}: {
  name:
    | "arrow"
    | "check"
    | "chevron"
    | "image"
    | "info"
    | "layout"
    | "pin"
    | "sparkles"
    | "trash"
    | "upload"
    | "x";
  className?: string;
}) => {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    image: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    layout: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    sparkles: (
      <path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3ZM5 15l-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15Zm14-1-.8 2.2L16 17l2.2.8L19 20l.8-2.2L22 17l-2.2-.8L19 14Z" />
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6" />
        <path d="M10 11v5m4-5v5" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m-5 5 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

const Field = ({
  label,
  children,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) => (
  <label className="field">
    <span className="field-label">
      {label}
      {optional && <span>Optional</span>}
    </span>
    {children}
  </label>
);

export default function App() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [description, setDescription] = useState("");
  const [shopName, setShopName] = useState("");
  const [spaceType, setSpaceType] = useState("");
  const [spaceSize, setSpaceSize] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [legalDocument, setLegalDocument] = useState<LegalDocument>(null);
  const photosRef = useRef<Photo[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(
      () => setCurrentSlide((current) => (current + 1) % SPACE_IMAGES.length),
      5000,
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!legalDocument) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLegalDocument(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [legalDocument]);

  const photoCount = useMemo(() => `${photos.length} / 6 photos`, [photos.length]);
  const compensation = useMemo(() => {
    const size = Number(spaceSize);
    const rate = SPACE_RATES[spaceType];
    if (!rate || !size) return null;

    const multiplier = currency === "NGN" ? 1600 : 1;
    const format = new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

    return {
      min: format.format(Math.round(rate.min * size * multiplier)),
      max: format.format(Math.round(rate.max * size * multiplier)),
    };
  }, [currency, spaceSize, spaceType]);

  const addPhotos = (files: FileList | File[]) => {
    const images = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6 - photos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...images]);
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addPhotos(event.target.files);
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitted(true);
  };

  const reset = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setDescription("");
    setShopName("");
    setSpaceType("");
    setSpaceSize("");
    setCurrency("NGN");
    setStep(1);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <main className="success-page">
        <div className="success-card">
          <div className="success-mark">
            <Icon name="check" className="size-8" />
          </div>
          <p className="eyebrow">Submission complete</p>
          <h1>Thanks for sharing your space.</h1>
          <p>
            We’ve prepared your submission for <strong>{shopName || "your shop"}</strong>. This
            prototype keeps everything in this browser and doesn’t send or save your details yet.
          </p>
          {compensation && (
            <div className="success-estimate">
              <span>Indicative monthly compensation</span>
              <strong>
                {compensation.min}–{compensation.max}
              </strong>
            </div>
          )}
          <button className="primary-button" onClick={reset}>
            Add another space <Icon name="arrow" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Nook home">
          <span className="brand-mark">N</span>
          <span>nook</span>
        </a>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Main navigation">
            <a href="#about">About us</a>
            <a href="#share-space">Share your space</a>
          </nav>
          <div className="header-note">
            <span className="hidden sm:inline">Need a hand?</span>
            <a href="mailto:hello@nookspaces.com">hello@nookspaces.com</a>
          </div>
        </div>
      </header>

      <div className="page-grid" id="share-space">
        <aside className="story-panel">
          <div className="story-copy">
            <p className="eyebrow">Space, put to good use</p>
            <h1>Your spare corner could be someone’s next big idea.</h1>
            <p>
              Earn monthly compensation from underused space in your shop. Your estimate is based on
              the kind of space and its size.
            </p>
          </div>

          <div className="photo-card">
            <div className="carousel-images">
              {SPACE_IMAGES.map((image, index) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  className={currentSlide === index ? "is-active" : ""}
                />
              ))}
              <div className="carousel-controls">
                <button
                  type="button"
                  aria-label="Previous space image"
                  onClick={() =>
                    setCurrentSlide(
                      (current) => (current - 1 + SPACE_IMAGES.length) % SPACE_IMAGES.length,
                    )
                  }
                >
                  <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  aria-label="Next space image"
                  onClick={() => setCurrentSlide((current) => (current + 1) % SPACE_IMAGES.length)}
                >
                  <Icon name="arrow" />
                </button>
              </div>
              <div className="carousel-dots" aria-label="Choose space image">
                {SPACE_IMAGES.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={currentSlide === index ? "is-active" : ""}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Show space image ${index + 1}`}
                    aria-current={currentSlide === index}
                  />
                ))}
              </div>
            </div>
            <div className="photo-caption">
              <span className="caption-icon">
                <Icon name="layout" className="size-4" />
              </span>
              <div>
                <strong>Every corner has potential</strong>
                <span>From window displays to workshop tables.</span>
              </div>
            </div>
          </div>

          <div className="trust-row">
            <span>
              <Icon name="check" /> Paid in Naira or USD
            </span>
            <span>
              <Icon name="check" /> Takes 3 minutes
            </span>
          </div>
        </aside>

        <section className="form-panel">
          <div className="form-shell">
            <div className="progress-head">
              <div>
                <p className="step-label">Step {step} of 2</p>
                <h2>{step === 1 ? "Show us your space" : "A few final details"}</h2>
              </div>
              <span>{step === 1 ? "Space details" : "Contact details"}</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${step * 50}%` }} />
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="form-body">
                  <Field label="Photos of the space">
                    <div
                      className={`dropzone ${dragging ? "is-dragging" : ""}`}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        addPhotos(event.dataTransfer.files);
                      }}
                    >
                      <input
                        aria-label="Upload photos"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                        onChange={handleFiles}
                        disabled={photos.length >= 6}
                      />
                      <div className="upload-icon">
                        <Icon name="upload" />
                      </div>
                      <strong>
                        {dragging ? "Drop your photos here" : "Drag & drop your photos here"}
                      </strong>
                      <span>
                        or <u>browse files</u> · JPG, PNG or WEBP up to 10MB
                      </span>
                    </div>
                  </Field>

                  {photos.length > 0 && (
                    <div>
                      <div className="photo-summary">
                        <span>{photoCount}</span>
                        <span>First photo will be the cover</span>
                      </div>
                      <div className="preview-grid">
                        {photos.map((photo, index) => (
                          <div className="preview" key={`${photo.file.name}-${photo.url}`}>
                            <img src={photo.url} alt={`Uploaded space preview ${index + 1}`} />
                            {index === 0 && <span className="cover-badge">Cover</span>}
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              aria-label={`Remove photo ${index + 1}`}
                            >
                              <Icon name="trash" className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="divider" />

                  <Field label="Shop name">
                    <input
                      required
                      value={shopName}
                      onChange={(event) => setShopName(event.target.value)}
                      placeholder="e.g. Field & Found"
                    />
                  </Field>

                  <Field label="Shop address">
                    <div className="input-icon">
                      <Icon name="pin" />
                      <input required placeholder="Start typing your address" />
                    </div>
                  </Field>

                  <div className="two-columns">
                    <Field label="City">
                      <input required placeholder="e.g. Lagos" autoComplete="address-level2" />
                    </Field>
                    <Field label="State">
                      <input
                        required
                        placeholder="e.g. Lagos State"
                        autoComplete="address-level1"
                      />
                    </Field>
                  </div>

                  <div className="two-columns">
                    <Field label="Space type">
                      <div className="select-wrap">
                        <select
                          required
                          value={spaceType}
                          onChange={(event) => setSpaceType(event.target.value)}
                        >
                          <option value="" disabled>
                            Select a type
                          </option>
                          <option>Window display</option>
                          <option>Retail floor space</option>
                          <option>Counter or shelf</option>
                          <option>Workshop or event area</option>
                          <option>Other</option>
                        </select>
                        <Icon name="chevron" />
                      </div>
                    </Field>
                    <Field label="Approx. size">
                      <div className="unit-input">
                        <input
                          required
                          inputMode="decimal"
                          type="number"
                          min="1"
                          value={spaceSize}
                          onChange={(event) => setSpaceSize(event.target.value)}
                          placeholder="12"
                        />
                        <span>m²</span>
                      </div>
                    </Field>
                  </div>

                  <div className="compensation-card" aria-live="polite">
                    <div className="compensation-top">
                      <div>
                        <span className="compensation-kicker">Estimated compensation</span>
                        <strong>
                          {compensation
                            ? `${compensation.min}–${compensation.max}`
                            : "Choose a type and size"}
                        </strong>
                        <p>Indicative monthly range</p>
                      </div>
                      <div className="currency-toggle" aria-label="Compensation currency">
                        {(["NGN", "USD"] as Currency[]).map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={currency === option ? "is-active" : ""}
                            onClick={() => setCurrency(option)}
                            aria-pressed={currency === option}
                          >
                            {option === "NGN" ? "₦ NGN" : "$ USD"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="estimate-note">
                      <Icon name="info" className="size-4" />
                      <span>
                        Your final offer may vary based on location, footfall, condition, and
                        availability. The current estimate uses an indicative ₦1,600/$ rate.
                      </span>
                    </div>
                  </div>

                  <Field label="Tell us about the space" optional>
                    <textarea
                      rows={4}
                      maxLength={400}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What makes it special? Mention footfall, natural light, access, or anything else worth knowing."
                    />
                    <span className="counter">{description.length} / 400</span>
                  </Field>
                </div>
              ) : (
                <div className="form-body">
                  <div className="summary-box">
                    <div className="summary-icon">
                      <Icon name="image" />
                    </div>
                    <div>
                      <strong>{shopName}</strong>
                      <span>
                        {photos.length
                          ? `${photos.length} photo${photos.length === 1 ? "" : "s"} ready`
                          : "No photos added"}
                      </span>
                    </div>
                    <button type="button" onClick={() => setStep(1)}>
                      Edit
                    </button>
                  </div>

                  {compensation && (
                    <div className="review-compensation">
                      <span>Estimated monthly compensation</span>
                      <strong>
                        {compensation.min}–{compensation.max}
                      </strong>
                      <small>
                        For {spaceSize} m² of {spaceType.toLowerCase()}
                      </small>
                    </div>
                  )}

                  <Field label="Your name">
                    <input required placeholder="Full name" autoComplete="name" />
                  </Field>
                  <Field label="Email address">
                    <input
                      required
                      type="email"
                      placeholder="you@yourshop.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Phone number" optional>
                    <input type="tel" placeholder="+44 7700 900000" autoComplete="tel" />
                  </Field>
                  <Field label="When is the space available?">
                    <div className="select-wrap">
                      <select required defaultValue="">
                        <option value="" disabled>
                          Choose availability
                        </option>
                        <option>Available now</option>
                        <option>Within the next month</option>
                        <option>In 1–3 months</option>
                        <option>Just exploring for now</option>
                      </select>
                      <Icon name="chevron" />
                    </div>
                  </Field>
                  <label className="checkbox-row">
                    <input required type="checkbox" />
                    <span>I confirm I’m allowed to share and offer this space.</span>
                  </label>
                  <div className="privacy-note">
                    This is a frontend prototype. Your details and images stay in this browser and
                    are cleared when the page refreshes.
                  </div>
                </div>
              )}

              <div className="form-footer">
                {step === 2 && (
                  <button className="back-button" type="button" onClick={() => setStep(1)}>
                    Back
                  </button>
                )}
                <button className="primary-button" type="submit">
                  {step === 1 ? "Continue" : "Submit my space"} <Icon name="arrow" />
                </button>
                {step === 1 && <p>Nothing is submitted until the final step.</p>}
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="about-section" id="about">
        <div className="about-heading">
          <p className="eyebrow">About nook</p>
          <h2>We see possibility in the spaces between.</h2>
        </div>
        <div className="about-content">
          <p className="about-lead">
            Nook helps independent shop owners make more of the space they already have.
          </p>
          <p>
            A quiet window, a spare shelf, or an unused corner can become a place for a maker to
            test an idea, a local brand to meet new customers, or a community to come together.
            We’re building a simpler, more thoughtful way to connect those spaces with the right
            people.
          </p>
          <div className="value-grid">
            <article>
              <span>01</span>
              <h3>Made for independents</h3>
              <p>
                Flexible opportunities designed around your shop, your customers, and your pace.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Local at heart</h3>
              <p>
                More reasons to visit the high street, discover new ideas, and support local trade.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Simple by design</h3>
              <p>No jargon or long commitments—just a clear way to understand what could work.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="brand brand-light" href="#" aria-label="Nook home">
              <span className="brand-mark">N</span>
              <span>nook</span>
            </a>
            <p>Making room for new ideas on every high street.</p>
          </div>
          <div className="footer-links">
            <div>
              <span>Explore</span>
              <a href="#share-space">Share your space</a>
              <a href="#about">About us</a>
            </div>
            <div>
              <span>Get in touch</span>
              <a href="mailto:hello@nookspaces.com">hello@nookspaces.com</a>
              <a href="tel:+442079460182">+44 (0)20 7946 0182</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Nook Spaces</span>
          <div>
            <button type="button" onClick={() => setLegalDocument("privacy")}>
              Privacy
            </button>
            <button type="button" onClick={() => setLegalDocument("terms")}>
              Terms
            </button>
          </div>
        </div>
      </footer>

      {legalDocument && (
        <div
          className="legal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-title"
        >
          <button
            className="legal-backdrop"
            type="button"
            onClick={() => setLegalDocument(null)}
            aria-label="Close"
          />
          <article className="legal-modal">
            <div className="legal-header">
              <div>
                <p className="eyebrow">Nook Spaces</p>
                <h2 id="legal-title">
                  {legalDocument === "privacy" ? "Privacy notice" : "Terms of use"}
                </h2>
                <span>Last updated: June 2025</span>
              </div>
              <button type="button" onClick={() => setLegalDocument(null)} aria-label="Close">
                <Icon name="x" />
              </button>
            </div>

            {legalDocument === "privacy" ? (
              <div className="legal-content">
                <p>
                  This notice explains how Nook Spaces would handle information submitted by shop
                  owners when the service becomes operational. This current prototype does not
                  transmit or permanently store your form entries or images.
                </p>
                <h3>Information we may collect</h3>
                <p>
                  We may collect your name, email address, phone number, shop name and address,
                  space details, availability, photographs, and any notes you choose to provide.
                </p>
                <h3>How we use it</h3>
                <p>
                  We use submitted information to review your space, prepare an indicative
                  compensation offer, contact you about suitable opportunities, prevent misuse, and
                  improve the Nook service. We do not sell your personal information.
                </p>
                <h3>Sharing and storage</h3>
                <p>
                  When live, images may be securely stored with a cloud hosting provider and details
                  may be shared only with service providers or potential space partners where needed
                  to assess a match. We retain information only as long as reasonably necessary.
                </p>
                <h3>Your choices</h3>
                <p>
                  You may ask to access, correct, or delete your information, or withdraw from
                  future opportunities, by emailing hello@nookspaces.com. Privacy rights may vary by
                  location.
                </p>
              </div>
            ) : (
              <div className="legal-content">
                <p>
                  These terms govern use of the Nook Spaces website and space submission experience.
                  By submitting information, you confirm that it is accurate and that you are
                  authorised to discuss use of the space.
                </p>
                <h3>Estimates are not offers</h3>
                <p>
                  Compensation ranges shown in Naira or US Dollars are illustrative estimates based
                  mainly on space type and size. Location, footfall, condition, availability,
                  demand, currency movements, and other factors may change a final offer. No
                  booking, tenancy, or payment obligation exists until separately agreed in writing.
                </p>
                <h3>Your content</h3>
                <p>
                  You retain ownership of photographs and descriptions you provide. You grant Nook
                  permission to review, resize, and share them with relevant prospective partners
                  solely to evaluate or promote a potential space opportunity.
                </p>
                <h3>Acceptable use</h3>
                <p>
                  Do not submit unlawful, misleading, confidential, infringing, or harmful content,
                  or information about a property you are not authorised to represent. We may reject
                  or remove submissions that do not meet these requirements.
                </p>
                <h3>Service availability</h3>
                <p>
                  The service may change or be unavailable from time to time. To the extent
                  permitted by law, Nook is not responsible for indirect losses arising from use of
                  this site. These generic terms will be replaced with jurisdiction-specific terms
                  before launch.
                </p>
              </div>
            )}

            <button className="legal-done" type="button" onClick={() => setLegalDocument(null)}>
              Done
            </button>
          </article>
        </div>
      )}
    </main>
  );
}
