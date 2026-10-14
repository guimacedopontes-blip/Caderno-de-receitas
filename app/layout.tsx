import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Caderno • Receitas que evoluem com você',description:'Seu caderno de receitas, experiências na cozinha e descobertas compartilhadas.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
