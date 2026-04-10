import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const banner = [
    {
        image: "/public/images/banner1.png",
    },
    {
        image: "/public/images/banner2.png",
    }
];

export default function ImageCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [prevEnabled, setPrevEnabled] = useState(false);
    const [nextEnabled, setNextEnabled] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState([]);
    const autoplayRef = useRef();

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index) => emblaApi?.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevEnabled(emblaApi.canScrollPrev());
        setNextEnabled(emblaApi.canScrollNext());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
    }, [emblaApi, onSelect]);

    // Autoplay effect with pause on hover
    useEffect(() => {
        if (!emblaApi) return;
        const node = emblaApi.rootNode();
        let autoplay;
        const startAutoplay = () => {
            autoplay = setInterval(() => {
                emblaApi.scrollNext();
            }, 4000);
            autoplayRef.current = autoplay;
        };
        const stopAutoplay = () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
        startAutoplay();
        node.addEventListener('mouseenter', stopAutoplay);
        node.addEventListener('mouseleave', startAutoplay);
        return () => {
            stopAutoplay();
            node.removeEventListener('mouseenter', stopAutoplay);
            node.removeEventListener('mouseleave', startAutoplay);
        };
    }, [emblaApi]);

    return (
        <div className="w-full px-4 md:px-8 mt-6">
            <div className="relative w-full overflow-hidden" ref={emblaRef} style={{height: '280px'}}>
                <div className="flex h-full">
                    {banner.map((slide, index) => (
                        <div key={index} className="flex-[0_0_100%] relative h-full">
                            <img
                                src={slide.image}
                                alt={`carousel-${index}`}
                                className="w-full h-full object-cover object-center rounded-lg"
                            />
                        </div>
                    ))}
                </div>
                {/* Navigation Buttons */}
                <button
                    onClick={scrollPrev}
                    disabled={!prevEnabled}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full z-10"
                >
                    <FiChevronLeft size={24} />
                </button>
                <button
                    onClick={scrollNext}
                    disabled={!nextEnabled}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 md:p-3 rounded-full z-10"
                >
                    <FiChevronRight size={24} />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollTo(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                                index === selectedIndex 
                                    ? 'bg-white scale-125 shadow-lg' 
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                        />
                    ))}
                </div>
                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-lg">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-b-lg"
                        style={{ width: `${((selectedIndex + 1) / scrollSnaps.length) * 100}%` }}
                    />
                </div>
            </div>
            <style>{`
                @media (min-width: 768px) {
                    .embla-carousel-hero, .embla-carousel-hero > div[ref] { height: 400px !important; }
                }
            `}</style>
        </div>
    );
}
