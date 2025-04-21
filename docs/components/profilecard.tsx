import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Github, User, Rss, Mail } from 'lucide-react';

interface CardProps {
    name: string;
    title: string;
    imgUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    devtoUrl: string;
    mailId?: string;
}

const ProfileCard: React.FC<CardProps> = ({ name, title, imgUrl, githubUrl, portfolioUrl, devtoUrl, mailId }) => {
    return (
        <div className="shadow-md h-auto p-6 rounded-lg max-w-sm border border-gray-300">
            {/* Profile Image with Border */}
            <div className="flex justify-center mb-4">
                <img
                    src={imgUrl}
                    alt={`${name}'s profile`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                />
            </div>

            {/* Header with no unnecessary border */}
            <div className="card-header text-center pb-4">
                <h2 className="text-2xl font-semibold">{name}</h2>
                <p className="text-gray-400">{title}</p>
            </div>

            {/* Body with Links and Border */}
            <div className="card-body mt-4 border-t flex justify-center border-gray-300 pt-4">
                <ul className="space-y-2 w-auto">
                    <li className="flex items-center space-x-2">
                        <Slot>
                            <a href={githubUrl} className="hover:underline text-blue-500" target="_blank" rel="noopener noreferrer">
                                <Github />
                                <span>Github</span>
                            </a>
                        </Slot>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Slot>
                            <a href={portfolioUrl} className="hover:underline text-blue-500" target="_blank" rel="noopener noreferrer">
                                <User />
                                <span>Portfolio</span>
                            </a>
                        </Slot>
                    </li>
                    <li className="flex items-center space-x-2">
                        <Slot>
                            <a href={devtoUrl} className="hover:underline text-blue-500" target="_blank" rel="noopener noreferrer">
                                <Rss />
                                <span>Dev.to</span>
                            </a>
                        </Slot>
                    </li>
                    {mailId && (
                    <li className="flex items-center space-x-2">
                        <Slot>
                            <a href={`mailto:${mailId}`} className="hover:underline text-blue-500" target="_blank" rel="noopener noreferrer">
                                <Mail />
                                <span>Mail</span>
                            </a>
                        </Slot>
                    </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ProfileCard;