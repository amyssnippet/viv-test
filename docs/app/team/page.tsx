import Link from "next/link";
import ProfileCard from "@/components/profilecard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team | Community | Bradcn",
  metadataBase: new URL("https://viv-test.vercel.app/community/team"),
  description: "Team page in Community section of VIV AI",
};

export default function TeamPage() {
  return (
    <main className="max-w-4xl mx-auto my-6">
      <h1 className="text-4xl font-bold my-4 pt-10">Team</h1>
      <p className="text-lg my-4 pt-6">
        The Bradcn team works on the core functionality, as well as our other projects.
      </p>
      <br />
      <p className="text-lg my-4">Current members of the Bradcn team are listed below.</p>
      
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
              devtoUrl="https://dev.to/amyssnippet"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <ProfileCard
              name="Bharat Sharma"
              title="Control Plane Manager"
              imgUrl="https://dineshverma.vercel.app/dinesh1.jpeg"
              githubUrl="https://github.com/DineshVerma-dev"
              portfolioUrl="https://dineshverma.vercel.app/"
              devtoUrl="https://dev.to/dinesh_verma"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <ProfileCard
              name="Yadnesh Bamne"
              title="UI Design Manager"
              imgUrl="https://dineshverma.vercel.app/dinesh1.jpeg"
              githubUrl="https://github.com/DineshVerma-dev"
              portfolioUrl="https://dineshverma.vercel.app/"
              devtoUrl="https://dev.to/dinesh_verma"
            />
          </div>
        </div>
      </div>
    </main>
  );
}