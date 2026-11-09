import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
    return (
        <div className="flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-card-border bg-card">
                <Compass className="h-8 w-8 text-primary" />
            </div>

            <p className="text-sm font-medium text-foreground-muted">404</p>
            <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Page not found
            </h1>
            <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-foreground-muted">
                The page you are looking for has moved or never existed.
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/">
                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                        <Home className="h-4 w-4" />
                        Back to home
                    </Button>
                </Link>
                <Link to="/explore">
                    <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto">
                        <ArrowLeft className="h-4 w-4" />
                        Explore feed
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
