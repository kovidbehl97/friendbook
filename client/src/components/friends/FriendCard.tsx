// client/src/components/friends/FriendCard.tsx

import { Link } from 'react-router-dom';

// Use a constant for the Cloudinary dummy image URL
const DUMMY_PROFILE_IMAGE_URL = "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

function FriendCard({ id, name, profileImageUrl }: { id: string; name: string; profileImageUrl?: string | null; }) {
  return (
    <div className='rounded-xl shadow flex flex-col overflow-hidden min-w-52 min-h-80 justify-between'>
      <div className='bg-gray-500 w-full h-full flex-1 cursor-pointer'>
        <Link to={`/profile/${id}`}>
          <img 
            src={profileImageUrl || DUMMY_PROFILE_IMAGE_URL} 
            alt={name} 
            className='w-full h-full object-cover aspect-square'
          />
        </Link>
      </div>
      <div className='bg-white w-full flex flex-col items-center gap-2 p-4'>
        <h3 className='font-semibold w-full text-xl'>{name}</h3>
        <Link to={`/profile/${id}`} className='w-full'>
          <button className='bg-blue-500 text-white rounded w-full p-2 font-semibold cursor-pointer text-sm'>
            See Profile
          </button>
        </Link>
      </div>
    </div>
  )
}

export default FriendCard;