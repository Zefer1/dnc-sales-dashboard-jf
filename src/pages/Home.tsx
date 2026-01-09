import { AvatarsList, CardComponent, Header } from '@/components';
import { Container } from '@mui/material';
import { currencyConverter } from '@/utils';

function Home() {
  const mockListData = [
    {
      avatar: '/dnc-avatar.svg',
      name: 'Nome Sobrenome 1',
      subtitle: currencyConverter(3200),
    },
    {
      avatar: '/dnc-avatar.svg',
      name: 'Nome Sobrenome 2',
      subtitle: currencyConverter(1200),
    },
     {
      avatar: '/dnc-avatar.svg',
      name: 'Nome Sobrenome 3',
      subtitle: currencyConverter(2200),
    },
  ];

  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <CardComponent>CARD</CardComponent>
        <CardComponent> 
          <AvatarsList listData={mockListData} />
        </CardComponent>
      </Container>
    </>
  );
}

export default Home;
