// friendbook/client/src/components/posts/CreatePostForm.tsx
import React, { useState, useEffect } from "react";
import {
  useCreatePost,
  PostType,
  CreatePostData,
} from "../../queries/posts/postQueries";
import { useCurrentUser } from "../../queries/users/useCurrentUser";
import { useFriends } from "../../queries/friends/friendQueries"; // NEW: Import the useFriends hook
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faCamera,
  faPersonHiking,
  faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import { faFaceGrinWide } from "@fortawesome/free-regular-svg-icons";

// DUMMY_FRIENDS removed as we now use real data
const DUMMY_PROFILE_IMAGE_URL =
  "https://res.cloudinary.com/dwpldlqbv/image/upload/v1754898012/rzpqnq0omenxrynvclxf.jpg";

const CreatePostForm = () => {
  const { data: currentUser } = useCurrentUser();
  const createPostMutation = useCreatePost();
  const { data: friends, isLoading: friendsLoading } = useFriends(); // NEW: Use the useFriends hook to get actual friends

  const [postType, setPostType] = useState<PostType>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [placeholder, setPlaceholder] = useState("What's on your mind?");
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const [showTaggingDropdown, setShowTaggingDropdown] = useState(false);

  useEffect(() => {
    switch (postType) {
      case "photo":
        setPlaceholder("Add a caption for your photo...");
        break;
      case "video":
        setPlaceholder("Add a caption for your video...");
        break;
      case "feeling":
        setPlaceholder("What are you feeling?");
        break;
      case "activity":
        setPlaceholder("What are you doing?");
        break;
      default:
        setPlaceholder("What's on your mind?");
        break;
    }
  }, [postType]);

  const resetForm = () => {
    setText("");
    setFile(null);
    setPostType("text");
    setTaggedFriends([]);
    setShowTaggingDropdown(false);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You must be logged in to create a post.");
      return;
    }

    const postData: CreatePostData = {
      type: postType,
      text: text.trim() || undefined,
      taggedFriends: taggedFriends.length > 0 ? taggedFriends : undefined,
    };

    if ((postType === "photo" || postType === "video") && !file) {
      alert("A file is required for this post type.");
      return;
    }

    if ((postType === "feeling" || postType === "activity") && !text.trim()) {
      alert("Content is required for this post type.");
      return;
    }

    const formData = new FormData();
    formData.append("type", postType);
    if (postData.text) formData.append("text", postData.text);
    if (postData.taggedFriends) {
      postData.taggedFriends.forEach(friendId => {
        formData.append("taggedFriends[]", friendId);
      });
    }

    if (file && postType === "photo") {
      formData.append("photo", file);
    } else if (file && postType === "video") {
      formData.append("video", file);
    }

    console.log("FormData contents:", {
      type: formData.get("type"),
      text: formData.get("text"),
      taggedFriends: formData.getAll("taggedFriends[]"),
      photo: formData.get("photo")
        ? {
            name: (formData.get("photo") as File).name,
            size: (formData.get("photo") as File).size,
          }
        : null,
      video: formData.get("video")
        ? {
            name: (formData.get("video") as File).name,
            size: (formData.get("video") as File).size,
          }
        : null,
    });

    try {
      await createPostMutation.mutateAsync(formData as any);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create post:", error);
      alert(
        error.response?.data?.error ||
          "Failed to create post. Please try again."
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (
      selectedFile &&
      postType === "video" &&
      !selectedFile.type.startsWith("video/")
    ) {
      alert("Please select a video file");
      setFile(null);
      return;
    }
    if (
      selectedFile &&
      postType === "photo" &&
      !selectedFile.type.startsWith("image/")
    ) {
      alert("Please select an image file");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleTagFriend = (friendId: string) => {
    setTaggedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const isSubmitDisabled = () => {
    if (createPostMutation.isPending) return true;
    if (postType === "text" && !text.trim()) return true;
    if ((postType === "photo" || postType === "video") && !file) {
      return true;
    }
    if ((postType === "feeling" || postType === "activity") && !text.trim()) {
      return true;
    }
    return false;
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow w-[650px]">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <img
            src={currentUser?.profileImageUrl || DUMMY_PROFILE_IMAGE_URL}
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>
        <form onSubmit={handlePostSubmit} className="flex-grow">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2 rounded-full bg-gray-100 placeholder-gray-500 focus:outline-none"
            disabled={createPostMutation.isPending}
          />
        </form>
      </div>

      {postType !== "text" && (
        <form
          onSubmit={handlePostSubmit}
          className="mt-4 border-b border-gray-200 pb-4 mb-4"
        >
          <div className="flex flex-col gap-4">
            {postType === "photo" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-input"
                  />
                  <label
                    htmlFor="photo-input"
                    className="text-white bg-blue-500 rounded-sm px-4 py-2 cursor-pointer hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Choose Photo
                  </label>
                  <span className="text-gray-700 truncate max-w-xs">
                    {file ? file.name : "No photo chosen"}
                  </span>
                </div>
              </div>
            )}
            {postType === "video" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="video-input"
                  />
                  <label
                    htmlFor="video-input"
                    className="text-white bg-blue-500 rounded-sm px-4 py-2 cursor-pointer hover:bg-blue-600 transition-colors font-semibold"
                  >
                    Choose Video
                  </label>
                  <span className="text-gray-700 truncate max-w-xs">
                    {file ? file.name : "No video chosen"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            {/* The tag users button and dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTaggingDropdown(!showTaggingDropdown)}
                className="px-4 py-2 rounded-full text-blue-500 font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faUserTag} />
                Tag friends
                {taggedFriends.length > 0 && ` (${taggedFriends.length})`}
              </button>
              {showTaggingDropdown && (
                <div className="absolute z-10 bottom-full mb-2 w-60 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {friendsLoading ? (
                    <div className="p-2 text-center text-gray-500">Loading friends...</div>
                  ) : (
                    friends?.map((friend) => (
                      <div
                        key={friend.id}
                        className="p-2 flex items-center justify-between hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleTagFriend(friend.id)}
                      >
                        <span>{friend.name}</span>
                        {taggedFriends.includes(friend.id) && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 text-right flex items-center justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-full text-gray-600 font-bold hover:bg-gray-200 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled={isSubmitDisabled()}
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Buttons for post types */}
      <div className="flex justify-between gap-4">
        <button
          onClick={() => setPostType("video")}
          className={`flex w-full gap-2 items-center justify-center p-2 rounded-lg font-semibold text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors ${
            postType === "video" ? "bg-gray-200" : ""
          }`}
        >
          <FontAwesomeIcon icon={faVideo} className="text-red-500 text-xl" />
          Video
        </button>
        <button
          onClick={() => setPostType("photo")}
          className={`flex w-full gap-2 items-center justify-center p-2 rounded-lg text-center font-semibold text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors ${
            postType === "photo" ? "bg-gray-200" : ""
          }`}
        >
          <FontAwesomeIcon icon={faCamera} className="text-green-500 text-xl" />
          Photo
        </button>
        <button
          onClick={() => setPostType("feeling")}
          className={`flex w-full gap-2 items-center justify-center p-2 rounded-lg text-center font-semibold text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors ${
            postType === "feeling" ? "bg-gray-200" : ""
          }`}
        >
          <FontAwesomeIcon
            icon={faFaceGrinWide}
            className="text-yellow-500 text-xl"
          />
          Feeling
        </button>
        <button
          onClick={() => setPostType("activity")}
          className={`flex w-full gap-2 items-center justify-center p-2 rounded-lg text-center font-semibold text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors ${
            postType === "activity" ? "bg-gray-200" : ""
          }`}
        >
          <FontAwesomeIcon
            icon={faPersonHiking}
            className="text-purple-500 text-xl"
          />
          Activity
        </button>
      </div>
    </div>
  );
};

export default CreatePostForm;
