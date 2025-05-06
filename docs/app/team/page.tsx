import Link from "next/link";
import ProfileCard from "@/components/profilecard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team | VIV AI",
  metadataBase: new URL("https://docs.cosinv.com/team"),
  description: "Team page of VIV AI",
};

export default function TeamPage() {
  return (
    <main className="max-w-4xl mx-auto my-6">
      <h1 className="text-4xl font-bold my-4 pt-10">Team</h1>
      <p className="text-lg my-4 pt-6">
        At Cosinv, we&rsquo;re more than just machine learning engineers and product designers &mdash; we&rsquo;re explorers of the intelligent frontier. Our diverse team brings together world-class experience in AI, data science, security, and scalable infrastructure to build solutions that rethink what&rsquo;s possible.
        From research labs to real-world impact, we&rsquo;re committed to delivering ethical, robust, and breakthrough AI for a safer, smarter future.
      </p>
      <br />
      <p className="text-lg my-4">Core members of the Cosinv Team are listed below.</p>

      {/* Responsive Wrapper for Profile Cards */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        {/* Profile Cards */}
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <ProfileCard
              name="Amol Yadav"
              title="LLM Manager"
              imgUrl="https://avatars.githubusercontent.com/u/135108994?v=4"
              githubUrl="https://github.com/amyssnippet"
              portfolioUrl="https://amolyadav.site/"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <ProfileCard
              name="Bharat Sharma"
              title="Control Plane Manager"
              imgUrl="https://avatars.githubusercontent.com/u/149818110?v=4"
              githubUrl="https://github.com/bhar1gitr"
              portfolioUrl="https://www.linkedin.com/in/bharat-sharma-50208b238/"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <ProfileCard
              name="Yadnesh Bamne"
              title="UI Design Manager"
              imgUrl="https://avatars.githubusercontent.com/u/110719904?v=4"
              githubUrl="https://github.com/YadneshBamne"
              portfolioUrl="https://www.linkedin.com/in/yadneshbamne21"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
