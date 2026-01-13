import { AvatarsList, CardComponent, CustomChart, CustomTable, StyledH1 } from '@/components'
import { currencyConverter } from '@/utils'

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
  const mockTableData = {
    headers: ['Name', 'Email', 'Actions'],
    rows: [
      [
        <span>Nome 1</span>,
        <span>nome1@email.com</span>,
        <button>ACTION</button>,
      ],
      [
        <span>Nome 2</span>,
        <span>nome2@email.com</span>,
        <button>ACTION</button>,
      ],
      [
        <span>Nome 3</span>,
        <span>nome3@email.com</span>,
        <button>ACTION</button>,
      ],
    ],
  };


  return (
    <>
      <StyledH1>Home</StyledH1>
      <CardComponent>CARD</CardComponent>
      <CardComponent>
        <AvatarsList listData={mockListData} />
      </CardComponent>
      <CardComponent>
        <CustomTable headers={mockTableData.headers} rows={mockTableData.rows} />
      </CardComponent>
      <CardComponent>
        <CustomChart
          labels={['Jan', 'Fev', 'Mar', 'Abr', 'Mai']}
          data={[1000.12, 2456.54, 986.32, 654.89, 1234.56, 1750.0]}
          type="bar"
        />
      </CardComponent>
    </>
  )
}

export default Home
