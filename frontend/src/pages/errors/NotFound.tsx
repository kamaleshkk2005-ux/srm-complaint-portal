import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <div className="relative mx-auto mb-8">
            <div className="text-[180px] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">🔍</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft size={16} />
              Go Back
            </Button>
            <Button asChild className="gap-2">
              <Link to="/">
                <Home size={16} />
                Go Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
