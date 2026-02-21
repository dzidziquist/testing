import { Settings, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
interface HeaderProps {
  title?: string;
  showBack?: boolean;
}
export function Header({
  title = 'Inukki'
}: HeaderProps) {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    profile
  } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return <header className="sticky top-0 z-40 glass">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">Inukki</span>
        </Link>

        <div className="flex items-center gap-1">
          {user ? <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-foreground text-background text-xs">
                        {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </> : <Button asChild variant="default" size="sm">
              <Link to="/auth">Sign In</Link>
            </Button>}
        </div>
      </div>
    </header>;
}