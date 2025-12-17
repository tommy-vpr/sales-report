import Image from "next/image";

// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <Image
        src={"/images/not-found-main.webp"}
        height={500}
        width={500}
        className="object-contain block"
        alt="404 Not Found"
        unoptimized
      />
      <p className="text-sm md:text-lg text-gray-400 mb-6 max-w-xl text-left">
        You've been abducted by aliens... or maybe just lost in space. The page
        you're looking for doesn't exist in this galaxy.
      </p>
      <a
        href="/"
        className="text-teal-500 rounded-md py-2 px-6 border border-teal-500
      hover:bg-teal-500 hover:text-gray-200 transition ease"
      >
        Go back home
      </a>
    </div>
  );
}
