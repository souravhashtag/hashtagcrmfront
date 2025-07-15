import React,{useEffect,useState} from 'react';
import { getScreenshots } from '../../../services/authService';
import { reverse } from 'dns';
const ScreenShort = () => {
    const [screenshots, setScreenshots] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const fetchScreenshots = async () => {
        try {
            const response = await getScreenshots();
            if (response) {
            setScreenshots(response);
            }
            console.log("data==>",response)
        } catch (err) {
            setError('Failed to fetch screenshots');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(()=>{
        fetchScreenshots()
    },[])
    return (
        <ul>
        {screenshots?.length > 0 && screenshots?.map((shot) => (
          <li key={shot._id}>
            <p>User: {shot.userid.firstName}</p>
            <img src={`${process.env.REACT_APP_IMAGE_URL}${shot.image}`} alt="Screenshot" width="300" />
            <p>Uploaded: {new Date(shot.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    );
};

export default ScreenShort
